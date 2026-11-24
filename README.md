# SandraMine (Rust)

**English** | [Português (BR)](README.pt-BR.md)

A desktop emulator of [NerdMiner v2](https://github.com/BitMaker-hub/NerdMiner_v2): a **solo**
Bitcoin "lottery" miner with the same T-Display (320x170) interface. It runs as a small "dock" on
your desktop, can hide in the system tray, and lets you control how much CPU and GPU it uses.

Runs on **macOS, Linux and Windows**.

🌐 **[Website](https://tnarnold.github.io/sandra-mine/)** · 📖 **[User manual](docs/MANUAL.md)**: setup, every screen and setting, how it works, troubleshooting.

## Features

- The 4 original screens (Miner, Clock, Global Stats and BTC Price), using the bitmaps, fonts and
  coordinates from the original firmware. Click the screen to switch (like the device button);
  drag to move the window.
- Stratum v1 (public-pool.io, solo.ckpool.org or any solo pool), with `mining.suggest_difficulty`.
- **Mining device selection: CPU, GPU or CPU + GPU**, each with its own usage limit, adjustable
  live without restarting:
  - **CPU**: number of threads + % usage per thread (duty cycle). Uses the processor's SHA
    instructions when available (ARMv8 / SHA-NI).
  - **GPU**: % usage (duty cycle) of a WGSL compute shader (wgpu → Metal / Vulkan / DX12).
    The GPU is **off** by default and only used when selected.
- System tray as a mini dashboard: status dot, mining stats, **network occupancy and the fee to use right now** (with the cost in sats and your currency), quick CPU/GPU controls. On macOS the fields you choose appear in the menu bar.
- Borderless window, "always on top" option, 1x–2.5x zoom, start hidden.
- App name, SandraMine, centered at the top; discreet Go BTC logo in the top-left corner (clicking it opens https://gobtc.com.br).
- BTC price in your currency (BRL, USD, EUR, GBP, CAD, CHF, AUD, JPY).
- **3D lab** that teaches how mining works in 8 steps, using your miner's real hashes. It takes no memory until opened.
- Free **animated course** on the website, no install needed: [How Bitcoin mining works](https://tnarnold.github.io/sandra-mine/course/), 9 lessons with real hashes computed in the browser and live network data.
- Interface in **English and Portuguese**, following the system language (switchable in the app). Adding a language is one file: `core/src/i18n.rs`.
- Network data (price, block height, global hashrate, fees, halving) from mempool.space.

> Solo mining with a CPU/GPU is a lottery: the chance of finding a block is tiny.
> The goal is fun and learning, just like the physical NerdMiner.

## Resource usage

Measured on a MacBook Air M1 (8 cores), `--release` build, mining against a local pool.
Process CPU is shown the way `top` reports it (100% = one full core; 800% = the whole machine).

| Selection | Process CPU | % of total CPU | Memory (phys_footprint) |
|---|---:|---:|---:|
| CPU, 4 threads @ 50% (default) | ~180% | ~22% | ~40 MB |
| CPU, 4 threads @ 100% | ~393% | ~49% | ~41 MB |
| CPU, 8 threads @ 25% | ~150% | ~19% | ~40 MB |
| CPU, 1 thread @ 10% | ~9% | ~1% | ~40 MB |
| GPU @ 30% | ~2% | <1% | ~41 MB |
| GPU @ 100% | ~5% | <1% | ~42 MB |
| CPU 4 @ 50% + GPU @ 30% | ~179% | ~22% | ~43 MB |

- **Memory**: stays between ~28 and ~45 MB and is stable over time (no growth). The UI (egui)
  and the 5 screen textures account for most of it; the miner itself uses a few KB per thread.
  With the GPU enabled, add ~10 MB of buffers/driver.
- **CPU**: usage follows `threads × % per thread`. With only the GPU selected, the CPU stays
  almost idle (it just coordinates and verifies candidates).
- **GPU**: the % controls how long the GPU is kept busy (each dispatch takes ~30 ms, followed by a
  proportional pause), so the desktop stays responsive.
- Reference hashrate on the M1: ~6.5 MH/s per CPU thread at 100% (4 threads ≈ 26 MH/s) and
  ~53 MH/s on the GPU at 100%.

## Install

Download the installer for your platform from the
[Releases](https://github.com/tnarnold/sandra-mine/releases) page:

- **macOS** (Apple Silicon and Intel): `SandraMine-<version>-macos-universal.dmg`. Open the
  `.dmg` and drag **SandraMine** into **Applications**. The app is not notarized by Apple,
  so the first time right-click the app → **Open** → **Open** (or run
  `xattr -dr com.apple.quarantine "/Applications/SandraMine.app"`).
- **Windows**: `...-windows-x86_64.zip`, extract it and run `sandra-mine.exe`.
- **Linux**: `...-linux-x86_64.tar.gz`, extract it and run `./install.sh`. It installs for your
  user (no sudo) the binary in `~/.local/bin`, the application menu entry and the icons.
  To remove it: `./install.sh --uninstall`. You can also run `./sandra-mine` directly without installing.

### Install from source (Linux)

```sh
cargo build --release
packaging/linux/install.sh   # same installer as the .tar.gz; PREFIX=/usr/local for system-wide
```

### Build the .dmg locally

```sh
scripts/package-macos.sh   # -> dist/SandraMine-<version>-macos-universal.dmg
```

With an Apple Developer account you can sign and notarize it by setting `MACOS_SIGN_IDENTITY`
and `MACOS_NOTARY_PROFILE` (see the top of the script).

### Publish a release

```sh
git tag v0.1.0 && git push origin v0.1.0
```

The `release` workflow builds the `.dmg`, `.zip` and `.tar.gz` and creates the GitHub Release.

## Build and run

Requires stable Rust (https://rustup.rs).

```sh
cargo run --release
```

### Linux dependencies

```sh
sudo apt install libxkbcommon-dev libwayland-dev libx11-dev libxcursor-dev libxrandr-dev \
  libxi-dev libgl1-mesa-dev libvulkan-dev libdbus-1-dev pkg-config
```

The Linux tray uses StatusNotifierItem (D-Bus, `ksni` crate). GNOME needs the
"AppIndicator and KStatusNotifierItem Support" extension; KDE, XFCE, Cinnamon etc. support it
out of the box.

## Configuration

See the [user manual](docs/MANUAL.md#5-settings-) for every option. In short: on first launch the ⚙ panel opens: enter your **BTC address** and click
*Salvar e reconectar* (save and reconnect). The configuration is stored at:

- macOS: `~/Library/Application Support/sandra-mine/config.json`
- Linux: `~/.config/sandra-mine/config.json`
- Windows: `%APPDATA%\sandra-mine\config.json`

Useful environment variables for development:

- `NERDMINER_CONFIG=/path/config.json`: use a different configuration file.
- `NERDMINER_SHOTS=/directory`: save raw RGBA screenshots of every screen, then exit. `NERDMINER_SHOTS_DELAY=<s>` starts later (default 8).
- `NERDMINER_TRAY_DUMP=1`: print the tray menu (title, tooltip, every line) to stderr on each refresh.
- `NERDMINER_LAB=1`: open the 3D lab at startup. With `NERDMINER_LAB_SHOTS=/directory`, save a screenshot of each step, then exit.
- `NERDMINER_LAB_CYCLE=1`: open and close the lab every 5 s, to check that memory is released (`once` opens it a single time).
- `NERDMINER_LAB_LOOK=dark`: open the lab on the dark background.
- `NERDMINER_LAB_BENCH=1`: log the lab's frame rate with no cap (`cap` keeps the 30 fps cap, `live` starts in the live view).
- `NERDMINER_RATE_LOG=1`: print the hashrate every 5 s (this PC, on screen, and fleet size).

### The pool doesn't connect

The miner only makes **outbound** connections to the pool (like a web browser), so it **does not
need UPnP or port forwarding**. If the dot next to the wifi icon on the Miner screen stays red,
your network is probably blocking the outbound port. Check with:

```sh
nc -vz public-pool.io 21496     # solo.ckpool.org uses port 3333
```

If it times out, allow outbound TCP on that port in your firewall, or try another network (e.g. a
phone hotspot). The detailed reason is shown in the log inside the ⚙ panel.

## Headless (servers, NAS, Raspberry Pi)

`sandra-mine-headless` is the same engine with no window, no tray and no GPU by default. It adds
hashrate to the same wallet on machines nobody looks at. Its default worker is
`sm-<computer>`, so the machine joins the other machines' **My fleet** on its own.

```sh
cargo build --release -p sandra-mine-headless                  # CPU only
cargo build --release -p sandra-mine-headless --features gpu,opencl   # with GPU
sandra-mine-headless --address bc1... --save                   # saves the wallet
sandra-mine-headless                                           # mines (add --gpu 100 for the GPU)
```

- **Defaults:**
  - every core at 100% under `SCHED_IDLE` + nice 19, so it only uses spare CPU;
  - pauses above **80 °C** (`--max-temp`);
  - one status line every 30 s.
- **Configuration:**
  - options and environment variables (`SANDRA_ADDRESS`, `SANDRA_WORKER`, `SANDRA_THREADS`…; see `--help`);
  - its own `headless.json`, next to the app's `config.json`.
- **Releases:** ship static (musl) binaries for x86_64, aarch64 and armv7, and glibc ones with GPU
  for x86_64 and aarch64.
- **GPU:** two backends, picked by `--gpu-backend` (`auto` by default):
  - `wgpu` (feature `gpu`): Vulkan / Metal / DX12;
  - `opencl` (feature `opencl`): libOpenCL loaded at run time. `auto` uses it on ARM Mali, whose
    Vulkan 1.0 driver is too old for wgpu, and as a fallback when wgpu finds no GPU.
  - On Linux the user needs access to the GPU device (Mali: the `video` group).
- **Examples:** `headless/` has a systemd service, a `Dockerfile` (CPU, static) and a `Dockerfile.gpu` (OpenCL).
- **Measured:** on an RK3588 NAS (4× Cortex-A76 + 4× A55), ~39 MH/s on the CPU plus ~24 MH/s on the
  Mali-G610 through OpenCL, **~63 MH/s** in total at 55 °C.

## Tests

```sh
cargo test --workspace --release -- --nocapture
```

Includes the genesis block hash (midstate path) and a GPU test that must find the real genesis
block nonce.

## Project layout

| File | Purpose |
|---|---|
| `core/` | `sandra-core`: the engine with no UI (pool, CPU mining, fleet, network data), shared with [sandra-mine-android](https://github.com/tnarnold/sandra-mine-android) |
| `headless/` | `sandra-mine-headless`: mining only, no UI (CLI, systemd service, Dockerfile) |
| `core/src/work.rs` | block header, coinbase/merkle, SHA-256d with midstate, difficulty |
| `core/src/stratum.rs` | Stratum v1 client |
| `core/src/miner.rs` | CPU threads with usage limit, hashrate calculation |
| `core/src/gpu.rs`, `core/src/sha256d.wgsl` | GPU miner (wgpu, `gpu` feature) |
| `core/src/opencl.rs`, `core/src/sha256d.cl` | OpenCL GPU backend (`opencl` feature, ARM Mali) |
| `src/screens.rs` | NerdMiner screens (bitmaps, fonts, coordinates) |
| `src/app.rs` | window, toolbar and settings |
| `src/tray.rs` | system tray (status dot, menu bar fields, network/fee dashboard) |
| `core/src/i18n.rs` | interface strings (English, Portuguese) |
| `src/lab/` | 3D lab: wgpu studio renderer, the 8 steps, real samples and the lessons |
| `site/course/` | animated web course (no build step); text in `i18n/<lang>.js`, checked by `node scripts/check-course-i18n.mjs` |
| `core/src/currency.rs` | display currencies |
| `core/src/netinfo.rs` | network data from mempool.space |

## Credits

UI based on NerdMiner v2 (© 2023 Bitmaker, MIT). See `assets/CREDITS.md`.
