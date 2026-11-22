use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(default)]
pub struct Config {
    pub pool_host: String,
    pub pool_port: u16,
    pub btc_address: String,
    pub worker_name: String,
    pub pool_password: String,
    /// Difficulty suggested to the pool (`mining.suggest_difficulty`), 0 = don't send.
    pub suggest_diff: f64,
    pub cpu_enabled: bool,
    pub cpu_threads: usize,
    /// Duty cycle per thread, 1..=100 %.
    pub cpu_usage: u32,
    pub gpu_enabled: bool,
    /// Duty cycle of the GPU, 1..=100 %.
    pub gpu_usage: u32,
    pub always_on_top: bool,
    pub start_hidden: bool,
    pub start_paused: bool,
    /// Scale of the 320x170 screen.
    pub zoom: f32,
    /// Fields shown next to the tray icon in the macOS menu bar
    /// ("hashrate", "fee", "last_block", "best_diff", "price").
    pub tray_fields: Vec<String>,
    /// Transaction size (vB) used to estimate the cost of sending now.
    pub tx_vbytes: u32,
    /// Display currency for the BTC price and fee costs (ISO code, see `currency`).
    pub currency: String,
    /// UI language: "auto" (system), or a code from `i18n::Lang` ("pt-BR", "en").
    pub language: String,
    /// Hashrate on the emulated screens: "auto" (fleet when 2+ machines mine for the
    /// same address), "local" (this PC only) or "fleet" (always the sum).
    pub fleet_mode: String,
    /// Stats URL of a pool without a known API (e.g. public-pool on Umbrel), with
    /// `{address}` where the BTC address goes. Empty = pick by `pool_host`.
    pub fleet_url: String,
}

impl Default for Config {
    fn default() -> Self {
        let cores = std::thread::available_parallelism().map(|n| n.get()).unwrap_or(4);
        Config {
            pool_host: "public-pool.io".into(),
            pool_port: 21496,
            btc_address: String::new(),
            worker_name: default_worker(),
            pool_password: "x".into(),
            suggest_diff: 1.0,
            cpu_enabled: true,
            cpu_threads: (cores / 2).max(1),
            cpu_usage: 50,
            gpu_enabled: false,
            gpu_usage: 30,
            always_on_top: false,
            start_hidden: false,
            start_paused: false,
            zoom: 1.5,
            tray_fields: vec!["hashrate".into(), "fee".into()],
            tx_vbytes: 141,
            currency: crate::currency::default_for_system(),
            language: "auto".into(),
            fleet_mode: "auto".into(),
            fleet_url: String::new(),
        }
    }
}

/// Worker name used by the old versions; every machine had the same one.
pub const OLD_WORKER: &str = "sandra-mine";

/// "sm-<hostname>", so each machine shows up under its own name on the pool.
/// Existing configs keep the name they have (serde fills only missing fields).
fn default_worker() -> String {
    let host: String = gethostname::gethostname()
        .to_string_lossy()
        .split('.')
        .next()
        .unwrap_or_default()
        .chars()
        .filter_map(|c| match c.to_ascii_lowercase() {
            c @ ('a'..='z' | '0'..='9') => Some(c),
            '-' | '_' | ' ' => Some('-'),
            _ => None,
        })
        .take(24)
        .collect();
    let host = host.trim_matches('-');
    if host.is_empty() { OLD_WORKER.into() } else { format!("sm-{host}") }
}

impl Config {
    pub fn path() -> PathBuf {
        if let Ok(p) = std::env::var("NERDMINER_CONFIG") {
            return PathBuf::from(p);
        }
        Self::dir("sandra-mine")
    }

    fn dir(app: &str) -> PathBuf {
        dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(app)
            .join("config.json")
    }

    pub fn load() -> Config {
        let path = Self::path();
        // The app used to be "nerdminer-emu": copy its config once, keeping the old file.
        if std::env::var_os("NERDMINER_CONFIG").is_none() && !path.exists() {
            let legacy = Self::dir("nerdminer-emu");
            if legacy.exists() {
                if let Some(dir) = path.parent() {
                    let _ = std::fs::create_dir_all(dir);
                }
                let _ = std::fs::copy(legacy, &path);
            }
        }
        std::fs::read_to_string(path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    }

    pub fn save(&self) {
        let p = Self::path();
        if let Some(dir) = p.parent() {
            let _ = std::fs::create_dir_all(dir);
        }
        if let Ok(s) = serde_json::to_string_pretty(self) {
            let _ = std::fs::write(p, s);
        }
    }

    pub fn username(&self) -> String {
        if self.worker_name.trim().is_empty() {
            self.btc_address.trim().to_string()
        } else {
            format!("{}.{}", self.btc_address.trim(), self.worker_name.trim())
        }
    }
}
