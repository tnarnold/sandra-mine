//! SandraMine's engine with no UI: pool connection (stratum v1), CPU mining,
//! fleet totals and Bitcoin network data. Shared by the desktop app and the
//! Android app (through JNI).

pub mod config;
pub mod currency;
pub mod fleet;
pub mod fmt;
#[cfg(feature = "gpu")]
pub mod gpu;
pub mod i18n;
pub mod miner;
pub mod netinfo;
pub mod state;
pub mod stratum;
pub mod work;

/// Without the `gpu` feature there is no GPU miner; `spawn` does nothing, so callers need no `cfg`.
#[cfg(not(feature = "gpu"))]
pub mod gpu {
    pub fn spawn(_shared: std::sync::Arc<crate::state::Shared>) {}
}
