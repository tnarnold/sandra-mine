// On 32-bit ARM, compile the SHA-256 kernel that uses the ARMv8 crypto extension
// (picked at runtime only when the CPU reports it, see work.rs).
fn main() {
    println!("cargo:rerun-if-changed=src/sha256_arm.c");
    if std::env::var("CARGO_CFG_TARGET_ARCH").as_deref() == Ok("arm") {
        let mut build = cc::Build::new();
        build
            .file("src/sha256_arm.c")
            .flag("-march=armv8-a+crypto")
            .flag("-mfpu=crypto-neon-fp-armv8")
            .opt_level(3);
        // Only the compiler's own headers (arm_neon.h, stdint.h) are needed. Keep clang off the
        // system include dirs, so a cross build doesn't pick up the host's glibc headers.
        if build.get_compiler().is_like_clang() {
            build.flag("-ffreestanding").flag("-nostdlibinc");
        }
        build.compile("sandra_sha256_arm");
    }
}
