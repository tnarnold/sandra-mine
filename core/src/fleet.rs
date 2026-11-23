//! "My fleet": other machines mining for the same BTC address, read from the pool's
//! public stats API, so the screens can show this PC's hashrate plus theirs.
//!
//! Solo pools group connections by the address in the stratum login
//! (`address.worker`), so one query per address lists every machine. The pool's
//! hashrate is an estimate from shares (noisy, minutes behind); this PC's part always
//! comes from the live local counter instead, so this module reports only the others.

use crate::state::{Fleet, FleetWorker, Shared};
use serde_json::Value;
use std::sync::Arc;
use std::sync::atomic::Ordering::*;
use std::time::{Duration, Instant};

/// How often to ask the pool. Its own numbers change about once a minute.
const EVERY: Duration = Duration::from_secs(60);
/// A machine with no share or heartbeat for this long is considered off.
const ACTIVE: Duration = Duration::from_secs(15 * 60);
/// On pools that only know worker names (ckpool), machines sharing this PC's name are
/// merged into one entry. Only when that entry is clearly above this PC's live rate is
/// the difference counted as other machines; below it, it is just estimate noise.
const MERGED_MARGIN: f64 = 1.5;

/// Stats URL for the configured pool, or `None` when its API is unknown.
pub fn api_url(cfg: &crate::config::Config) -> Option<String> {
    let addr = cfg.btc_address.trim();
    if addr.is_empty() {
        return None;
    }
    let custom = cfg.fleet_url.trim();
    if !custom.is_empty() {
        return Some(if custom.contains("{address}") {
            custom.replace("{address}", addr)
        } else {
            format!("{}/{addr}", custom.trim_end_matches('/'))
        });
    }
    let host = cfg.pool_host.to_lowercase();
    if host.contains("public-pool.io") {
        Some(format!("https://public-pool.io:40557/api/client/{addr}"))
    } else if host.contains("ckpool") {
        Some(format!("https://solo.ckpool.org/users/{addr}"))
    } else {
        None
    }
}

/// ckpool writes hashrates as "30.4M", "5.57G", ...
fn si_value(v: &Value) -> Option<f64> {
    if let Some(x) = v.as_f64() {
        return Some(x);
    }
    let s = v.as_str()?.trim();
    let (num, mult) = match s.chars().last()? {
        'K' | 'k' => (&s[..s.len() - 1], 1e3),
        'M' => (&s[..s.len() - 1], 1e6),
        'G' => (&s[..s.len() - 1], 1e9),
        'T' => (&s[..s.len() - 1], 1e12),
        'P' => (&s[..s.len() - 1], 1e15),
        'E' => (&s[..s.len() - 1], 1e18),
        _ => (s, 1.0),
    };
    num.trim().parse::<f64>().ok().map(|x| x * mult)
}

fn number(v: &Value) -> f64 {
    v.as_f64().or_else(|| v.as_str().and_then(|s| s.parse().ok())).unwrap_or(0.0)
}

/// One pool entry before deciding which one is this PC.
struct Entry {
    name: String,
    session: Option<String>,
    hashrate: f64,
    best: f64,
}

/// public-pool: `{workersCount, workers: [{sessionId, name, hashRate, bestDifficulty, lastSeen}]}`.
fn parse_public_pool(v: &Value, now: chrono::DateTime<chrono::Utc>) -> Option<Vec<Entry>> {
    let list = v.get("workers")?.as_array()?;
    Some(
        list.iter()
            .filter(|w| {
                // Keep entries without a readable date; drop the ones clearly stale.
                w["lastSeen"]
                    .as_str()
                    .and_then(|t| chrono::DateTime::parse_from_rfc3339(t).ok())
                    .is_none_or(|t| (now - t.with_timezone(&chrono::Utc)).num_seconds() < ACTIVE.as_secs() as i64)
            })
            .map(|w| Entry {
                name: w["name"].as_str().unwrap_or("?").to_string(),
                session: w["sessionId"].as_str().map(str::to_ascii_lowercase),
                hashrate: number(&w["hashRate"]),
                best: number(&w["bestDifficulty"]),
            })
            .collect(),
    )
}

/// ckpool: `{worker: [{workername: "address.name", hashrate5m: "30.4M", lastshare, bestshare}]}`.
fn parse_ckpool(v: &Value, now_unix: i64) -> Option<Vec<Entry>> {
    let list = v.get("worker")?.as_array()?;
    Some(
        list.iter()
            .filter(|w| w["lastshare"].as_i64().is_none_or(|t| now_unix - t < ACTIVE.as_secs() as i64))
            .map(|w| {
                let full = w["workername"].as_str().unwrap_or("?");
                Entry {
                    name: full.split_once('.').map_or(full, |(_, n)| n).to_string(),
                    session: None,
                    hashrate: si_value(&w["hashrate5m"]).or_else(|| si_value(&w["hashrate1m"])).unwrap_or(0.0),
                    best: number(&w["bestshare"]),
                }
            })
            .filter(|e| e.hashrate > 0.0)
            .collect(),
    )
}

/// Builds the fleet from the pool entries: finds this PC, sums the others.
fn summarize(entries: Vec<Entry>, session: &str, worker: &str, local: f64) -> Fleet {
    let by_session = !session.is_empty() && entries.iter().any(|e| e.session.as_deref() == Some(session));
    let is_me = |e: &Entry| {
        if by_session {
            e.session.as_deref() == Some(session)
        } else {
            e.name == worker
        }
    };
    let mut others = 0.0;
    let mut mine_pool = 0.0;
    let mut found_me = false;
    let mut best: f64 = 0.0;
    let mut workers = Vec::with_capacity(entries.len());
    for e in entries {
        let me = is_me(&e);
        if me {
            found_me = true;
            mine_pool += e.hashrate;
        } else {
            others += e.hashrate;
        }
        best = best.max(e.best);
        workers.push(FleetWorker { name: e.name, hashrate: e.hashrate, best: e.best, me });
    }
    // Matched by name only: other machines with this PC's name are hidden in that entry.
    let mut machines = workers.len() + usize::from(!found_me);
    if !by_session && mine_pool > local * MERGED_MARGIN {
        others += mine_pool - local;
        machines += 1;
    }
    workers.sort_by(|a, b| b.me.cmp(&a.me).then(b.hashrate.total_cmp(&a.hashrate)));
    Fleet { workers, others, machines, best, at: Instant::now() }
}

fn fetch(agent: &ureq::Agent, url: &str) -> Option<Value> {
    let mut resp = agent.get(url).call().ok()?;
    let body = resp.body_mut().read_to_string().ok()?;
    serde_json::from_str(&body).ok()
}

/// Settings that change what to ask; a change triggers a new query.
fn key(shared: &Shared) -> (String, String, u64) {
    let c = shared.config.read().unwrap();
    (api_url(&c).unwrap_or_default(), c.fleet_mode.clone(), shared.config_gen.load(Acquire))
}

pub fn spawn(shared: Arc<Shared>) {
    std::thread::Builder::new()
        .name("fleet".into())
        .spawn(move || {
            let agent: ureq::Agent = ureq::Agent::config_builder()
                .timeout_global(Some(Duration::from_secs(10)))
                .build()
                .into();
            // Give the stratum session time to subscribe, so this PC's session id is known.
            std::thread::sleep(Duration::from_secs(15));
            loop {
                let k = key(&shared);
                let (url, mode, _) = &k;
                if mode != "local" && !url.is_empty() {
                    let (session, worker) = {
                        let c = shared.config.read().unwrap();
                        (shared.session_id.lock().unwrap().clone(), c.worker_name.trim().to_string())
                    };
                    let now = chrono::Utc::now();
                    let entries = fetch(&agent, url).and_then(|v| {
                        parse_public_pool(&v, now).or_else(|| parse_ckpool(&v, now.timestamp()))
                    });
                    // On failure keep the last data; it is ignored once stale.
                    if let Some(e) = entries {
                        *shared.fleet.lock().unwrap() = Some(summarize(e, &session, &worker, shared.hashrate()));
                    }
                } else {
                    *shared.fleet.lock().unwrap() = None;
                }
                // Wait for the next round, or until the pool/address/mode changes.
                let start = Instant::now();
                while start.elapsed() < EVERY {
                    std::thread::sleep(Duration::from_secs(1));
                    if key(&shared) != k {
                        *shared.fleet.lock().unwrap() = None;
                        // Let the stratum reconnect first (new session id).
                        std::thread::sleep(Duration::from_secs(10));
                        break;
                    }
                }
            }
        })
        .expect("spawn fleet thread");
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn e(name: &str, session: Option<&str>, h: f64) -> Entry {
        Entry { name: name.into(), session: session.map(Into::into), hashrate: h, best: 1.0 }
    }

    #[test]
    fn public_pool_matches_by_session_even_with_same_names() {
        let f = summarize(
            vec![e("sandra-mine", Some("aa"), 70e6), e("sandra-mine", Some("bb"), 120e6), e("sandra-mine", Some("cc"), 60e6)],
            "aa",
            "sandra-mine",
            80e6,
        );
        assert_eq!(f.machines, 3);
        assert_eq!(f.others, 180e6);
        assert!(f.workers[0].me);
    }

    #[test]
    fn not_listed_yet_still_counts_this_pc() {
        let f = summarize(vec![e("sala", Some("bb"), 60e6)], "aa", "notebook", 80e6);
        assert_eq!(f.machines, 2);
        assert_eq!(f.others, 60e6);
    }

    #[test]
    fn ckpool_by_name_and_merged_names() {
        // Distinct names: exact.
        let f = summarize(vec![e("notebook", None, 85e6), e("sala", None, 60e6)], "", "notebook", 80e6);
        assert_eq!((f.machines, f.others), (2, 60e6));
        // Two PCs share the name: the excess over this PC counts as another machine.
        let f = summarize(vec![e("sandra-mine", None, 200e6)], "", "sandra-mine", 80e6);
        assert_eq!((f.machines, f.others), (2, 120e6));
        // Estimate a bit above the live rate is noise, not a second machine.
        let f = summarize(vec![e("sandra-mine", None, 95e6)], "", "sandra-mine", 80e6);
        assert_eq!((f.machines, f.others), (1, 0.0));
    }

    #[test]
    fn parses_both_pools() {
        let now = chrono::DateTime::parse_from_rfc3339("2026-11-22T18:00:00Z").unwrap().with_timezone(&chrono::Utc);
        let pp = json!({"workersCount": 2, "workers": [
            {"sessionId": "AB12", "name": "a", "hashRate": 1.5e8, "bestDifficulty": "12.50", "lastSeen": "2026-11-22T17:59:00.000Z"},
            {"sessionId": "cd34", "name": "b", "hashRate": "2e8", "bestDifficulty": "3.00", "lastSeen": "2026-11-22T10:00:00.000Z"}
        ]});
        let v = parse_public_pool(&pp, now).unwrap();
        assert_eq!(v.len(), 1, "stale worker dropped");
        assert_eq!(v[0].session.as_deref(), Some("ab12"));
        assert_eq!(v[0].best, 12.5);

        let ck = json!({"worker": [
            {"workername": "bc1qx.notebook", "hashrate5m": "17.9M", "lastshare": 1000, "bestshare": 2.5},
            {"workername": "bc1qx.old", "hashrate5m": "0", "lastshare": 1000}
        ]});
        let v = parse_ckpool(&ck, 1100).unwrap();
        assert_eq!(v.len(), 1);
        assert_eq!(v[0].name, "notebook");
        assert!((v[0].hashrate - 17.9e6).abs() < 1.0);
        assert!(parse_public_pool(&ck, now).is_none());
    }

    #[test]
    fn urls() {
        let mut c = crate::config::Config { btc_address: "bc1qx".into(), ..Default::default() };
        c.pool_host = "public-pool.io".into();
        assert_eq!(api_url(&c).unwrap(), "https://public-pool.io:40557/api/client/bc1qx");
        c.pool_host = "solo.ckpool.org".into();
        assert_eq!(api_url(&c).unwrap(), "https://solo.ckpool.org/users/bc1qx");
        c.pool_host = "umbrel.local".into();
        assert!(api_url(&c).is_none());
        c.fleet_url = "http://umbrel.local:2019/api/client/{address}".into();
        assert_eq!(api_url(&c).unwrap(), "http://umbrel.local:2019/api/client/bc1qx");
    }
}
