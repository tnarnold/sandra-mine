//! SandraMine's engine with no UI: pool connection (stratum v1), CPU mining,
//! fleet totals and Bitcoin network data. Shared by the desktop app and the
//! Android app (through JNI).

pub mod config;
pub mod currency;
pub mod fleet;
pub mod fmt;
#[cfg(any(feature = "gpu", feature = "opencl"))]
pub mod gpu;
pub mod i18n;
pub mod miner;
pub mod netinfo;
#[cfg(feature = "opencl")]
pub mod opencl;
pub mod state;
pub mod stratum;
pub mod work;

/// Without the `gpu` and `opencl` features there is no GPU miner; `spawn` does nothing, so
/// callers need no `cfg`.
#[cfg(not(any(feature = "gpu", feature = "opencl")))]
pub mod gpu {
    pub fn spawn(_shared: std::sync::Arc<crate::state::Shared>) {}
}
