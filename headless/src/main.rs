//! SandraMine with no UI: the same engine as the desktop app (sandra-core), for servers,
//! NAS boxes and Raspberry Pis. It mines at the lowest CPU priority by default, prints a
//! status line every few seconds and joins the same fleet as the other machines.

use sandra_core::config::Config;
use sandra_core::state::{PoolStatus, Shared};
use sandra_core::{fleet, fmt, gpu, i18n, miner, netinfo, stratum, work};
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::Ordering::*;
use std::time::Duration;

const HELP: &str = "\
sandra-mine-headless: SandraMine sem interface (só a mineração)

Uso: sandra-mine-headless [opções]

  --address BC1...     carteira Bitcoin que recebe o bloco          (SANDRA_ADDRESS)
  --worker NOME        nome desta máquina na pool, padrão sm-<host>  (SANDRA_WORKER)
  --pool HOST:PORTA    pool solo, padrão public-pool.io:21496        (SANDRA_POOL)
  --threads N          threads de CPU, padrão todos os núcleos       (SANDRA_THREADS)
  --cpu PCT            uso de cada thread, 1-100, padrão 100         (SANDRA_CPU)
  --gpu PCT            minera também na GPU, 1-100 (build com gpu)   (SANDRA_GPU)
  --max-temp C         pausa acima de C °C, 0 desliga, padrão 80     (SANDRA_MAX_TEMP)
  --no-low-priority    não usa SCHED_IDLE + nice 19
  --config ARQUIVO     arquivo de configuração                       (SANDRA_CONFIG)
                       padrão: <config>/sandra-mine/headless.json
  --status-every SEG   linha de status a cada SEG segundos, padrão 30
  --save               grava a configuração resultante e sai
  -h, --help           esta ajuda

Prioridade: opções > variáveis de ambiente > arquivo > padrões.";

/// The settings as given on the command line / environment, before they touch the config.
#[derive(Default, Debug, PartialEq)]
struct Overrides {
    address: Option<String>,
    worker: Option<String>,
    pool: Option<(String, u16)>,
    threads: Option<usize>,
    cpu: Option<u32>,
    gpu: Option<u32>,
    max_temp: Option<u32>,
    no_low_priority: bool,
    config: Option<PathBuf>,
    status_every: Option<u64>,
    save: bool,
}

fn parse_pool(v: &str) -> Result<(String, u16), String> {
    match v.rsplit_once(':') {
        Some((h, p)) if !h.is_empty() => {
            Ok((h.to_string(), p.parse().map_err(|_| format!("porta inválida em --pool {v}"))?))
        }
        _ => Ok((v.to_string(), 21496)),
    }
}

fn num<T: std::str::FromStr>(name: &str, v: &str) -> Result<T, String> {
    v.trim().parse().map_err(|_| format!("{name}: número inválido \"{v}\""))
}

/// Environment first, then the arguments on top of it.
fn parse(args: &[String], env: impl Fn(&str) -> Option<String>) -> Result<Overrides, String> {
    let mut o = Overrides {
        address: env("SANDRA_ADDRESS"),
        worker: env("SANDRA_WORKER"),
        config: env("SANDRA_CONFIG").map(PathBuf::from),
        ..Default::default()
    };
    if let Some(v) = env("SANDRA_POOL") { o.pool = Some(parse_pool(&v)?); }
    if let Some(v) = env("SANDRA_THREADS") { o.threads = Some(num("SANDRA_THREADS", &v)?); }
    if let Some(v) = env("SANDRA_CPU") { o.cpu = Some(num("SANDRA_CPU", &v)?); }
    if let Some(v) = env("SANDRA_GPU") { o.gpu = Some(num("SANDRA_GPU", &v)?); }
    if let Some(v) = env("SANDRA_MAX_TEMP") { o.max_temp = Some(num("SANDRA_MAX_TEMP", &v)?); }

    let mut it = args.iter();
    while let Some(a) = it.next() {
        let (key, inline) = match a.split_once('=') {
            Some((k, v)) if k.starts_with("--") => (k, Some(v.to_string())),
            _ => (a.as_str(), None),
        };
        let mut value = || inline.clone().or_else(|| it.next().cloned()).ok_or(format!("{key} precisa de um valor"));
        match key {
            "--address" => o.address = Some(value()?),
            "--worker" => o.worker = Some(value()?),
            "--pool" => o.pool = Some(parse_pool(&value()?)?),
            "--threads" => o.threads = Some(num(key, &value()?)?),
            "--cpu" => o.cpu = Some(num(key, &value()?)?),
            "--gpu" => o.gpu = Some(num(key, &value()?)?),
            "--max-temp" => o.max_temp = Some(num(key, &value()?)?),
            "--config" => o.config = Some(PathBuf::from(value()?)),
            "--status-every" => o.status_every = Some(num(key, &value()?)?),
            "--no-low-priority" => o.no_low_priority = true,
            "--save" => o.save = true,
            "-h" | "--help" => return Err(String::new()),
            _ => return Err(format!("opção desconhecida: {a}")),
        }
    }
    Ok(o)
}

/// Defaults for a machine nobody looks at: all cores, full duty, idlest priority, heat limit.
fn headless_defaults() -> Config {
    Config {
        cpu_threads: miner::max_threads(),
        cpu_usage: 100,
        gpu_enabled: false,
        low_priority: true,
        max_temp_c: 80,
        ..Config::default()
    }
}

fn apply(mut cfg: Config, o: &Overrides) -> Config {
    if let Some(v) = &o.address { cfg.btc_address = v.trim().to_string(); }
    if let Some(v) = &o.worker { cfg.worker_name = v.trim().to_string(); }
    if let Some((h, p)) = &o.pool {
        cfg.pool_host = h.clone();
        cfg.pool_port = *p;
    }
    if let Some(v) = o.threads { cfg.cpu_threads = v; }
    if let Some(v) = o.cpu { cfg.cpu_usage = v; }
    if let Some(v) = o.gpu {
        cfg.gpu_enabled = v > 0;
        cfg.gpu_usage = v.max(1);
    }
    if let Some(v) = o.max_temp { cfg.max_temp_c = v; }
    if o.no_low_priority { cfg.low_priority = false; }
    cfg.cpu_threads = cfg.cpu_threads.clamp(1, miner::max_threads());
    cfg.cpu_usage = cfg.cpu_usage.clamp(1, 100);
    cfg.gpu_usage = cfg.gpu_usage.clamp(1, 100);
    cfg.start_paused = false;
    cfg
}

fn default_path() -> PathBuf {
    Config::path().with_file_name("headless.json")
}

fn status_line(s: &Shared, pt: bool) -> String {
    let (v, u) = fmt::hashrate(s.hashrate());
    let mut line = format!("{v} {u}");
    if let (screen, Some(n)) = s.screen_hashrate() {
        let (fv, fu) = fmt::hashrate(screen);
        line += &if pt { format!(" · frota {n} máq. {fv} {fu}") } else { format!(" · fleet {n} machines {fv} {fu}") };
    }
    let pool = match &*s.pool_status.lock().unwrap() {
        PoolStatus::Connected(_) => if pt { "pool conectada" } else { "pool connected" }.to_string(),
        PoolStatus::Connecting(h) => format!("{} {h}", if pt { "conectando a" } else { "connecting to" }),
        PoolStatus::Disconnected => if pt { "pool desconectada" } else { "pool disconnected" }.to_string(),
        PoolStatus::NoAddress => if pt { "sem carteira" } else { "no address" }.to_string(),
        PoolStatus::Error(e) => format!("{}: {e}", if pt { "erro" } else { "error" }),
    };
    line += &format!(
        " · {pool} · shares {}/{} · {} {}",
        s.accepted.load(Relaxed),
        s.rejected.load(Relaxed),
        if pt { "melhor" } else { "best" },
        fmt::diff(s.screen_best_diff()),
    );
    let temp = s.temp_milli.load(Relaxed);
    if temp > 0 {
        line += &format!(" · {} °C", temp / 1000);
    }
    if s.thermal_hold.load(Relaxed) {
        line += if pt { " (pausado: quente)" } else { " (paused: hot)" };
    }
    line
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let o = match parse(&args, |k| std::env::var(k).ok().filter(|v| !v.trim().is_empty())) {
        Ok(o) => o,
        Err(e) if e.is_empty() => {
            println!("{HELP}");
            return;
        }
        Err(e) => {
            eprintln!("{e}\n\n{HELP}");
            std::process::exit(2);
        }
    };
    let path = o.config.clone().unwrap_or_else(default_path);
    let cfg = apply(Config::load_from(&path).unwrap_or_else(headless_defaults), &o);
    if o.save {
        cfg.save_to(&path);
        println!("{}", path.display());
        return;
    }
    if cfg.btc_address.trim().is_empty() {
        eprintln!(
            "Falta a carteira: use --address bc1... (ou SANDRA_ADDRESS), e --save para gravar em {}",
            path.display()
        );
        std::process::exit(2);
    }
    let lang = i18n::resolve(&cfg.language);
    i18n::set(lang);
    let pt = matches!(lang, i18n::Lang::Pt);
    #[cfg(not(feature = "gpu"))]
    if cfg.gpu_enabled {
        eprintln!("{}", if pt { "Este binário não tem GPU (build sem --features gpu): só CPU." } else { "This build has no GPU support (no --features gpu): CPU only." });
    }
    println!(
        "SandraMine headless · {} · {}:{} · {} threads × {}% · {}{}",
        cfg.worker_name,
        cfg.pool_host,
        cfg.pool_port,
        cfg.cpu_threads,
        cfg.cpu_usage,
        if cfg.low_priority { "SCHED_IDLE" } else { "normal priority" },
        if work::arm_sha_hw() { " · ARM SHA" } else { "" },
    );
    let every = Duration::from_secs(o.status_every.unwrap_or(30).max(1));

    let shared = Shared::new(cfg);
    stratum::spawn(shared.clone());
    miner::spawn_cpu(shared.clone());
    miner::spawn_stats(shared.clone());
    miner::spawn_thermal(shared.clone());
    gpu::spawn(shared.clone());
    netinfo::spawn(shared.clone());
    fleet::spawn(shared.clone());
    // The engine's log already goes to stderr (Shared::log); this adds the periodic summary.
    // Nothing needs flushing on exit, so SIGTERM/Ctrl+C simply end the process.
    let shared: Arc<Shared> = shared;
    loop {
        std::thread::sleep(every);
        println!("{}", status_line(&shared, pt));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(s: &str) -> Vec<String> {
        s.split_whitespace().map(String::from).collect()
    }

    #[test]
    fn arguments_win_over_the_environment() {
        let env = |k: &str| match k {
            "SANDRA_ADDRESS" => Some("bc1env".to_string()),
            "SANDRA_THREADS" => Some("3".to_string()),
            "SANDRA_POOL" => Some("pool.local".to_string()),
            _ => None,
        };
        let o = parse(&args("--threads 6 --pool=solo.ckpool.org:3333 --gpu 40 --save"), env).unwrap();
        assert_eq!(o.address.as_deref(), Some("bc1env"));
        assert_eq!(o.threads, Some(6));
        assert_eq!(o.pool, Some(("solo.ckpool.org".into(), 3333)));
        assert_eq!(o.gpu, Some(40));
        assert!(o.save);
        assert_eq!(parse(&args(""), env).unwrap().pool, Some(("pool.local".into(), 21496)));
    }

    #[test]
    fn bad_input_is_an_error() {
        let none = |_: &str| None;
        assert!(parse(&args("--threads lots"), none).is_err());
        assert!(parse(&args("--bogus"), none).is_err());
        assert!(parse(&args("--worker"), none).is_err());
        assert_eq!(parse(&args("--help"), none).unwrap_err(), "");
    }

    #[test]
    fn defaults_are_quiet_and_overrides_are_clamped() {
        let d = headless_defaults();
        assert!(d.low_priority && !d.gpu_enabled);
        assert_eq!((d.cpu_usage, d.max_temp_c, d.cpu_threads), (100, 80, miner::max_threads()));
        let o = Overrides { threads: Some(10_000), cpu: Some(0), gpu: Some(0), no_low_priority: true, ..Default::default() };
        let c = apply(d, &o);
        assert_eq!((c.cpu_threads, c.cpu_usage), (miner::max_threads(), 1));
        assert!(!c.gpu_enabled && !c.low_priority);
    }
}
