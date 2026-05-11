fn main() {
    // SP1_BUILD_SKIP — used by IDE indexing / cargo check. Write a stub so include_elf! compiles.
    println!("cargo:rerun-if-env-changed=SP1_BUILD_SKIP");
    if std::env::var("SP1_BUILD_SKIP").is_ok() {
        let out_dir = std::env::var("OUT_DIR").unwrap();
        let stub = format!("{out_dir}/zk-student-circuit.elf");
        std::fs::write(&stub, []).unwrap();
        println!("cargo:rustc-env=SP1_ELF_zk-student-circuit={stub}");
        return;
    }

    // Use the ELF produced by `cargo prove build` from circuits/program/ when it exists.
    // sp1_build::build_program_with_args passes -Ztrim-paths to the system cargo, which adds
    // --remap-path-scope=object to every Succinct-rustc invocation. The Succinct rustc fork does
    // not support that flag, so we avoid the sp1-build subprocess when the ELF is already fresh.
    let manifest = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let workspace = std::path::Path::new(&manifest).parent().unwrap();
    let elf = workspace.join(
        "target/elf-compilation/riscv32im-succinct-zkvm-elf/release/zk-student-circuit",
    );

    if elf.exists() {
        println!("cargo:rustc-env=SP1_ELF_zk-student-circuit={}", elf.display());
        // Rerun when the ELF itself changes (i.e. after the next `cargo prove build`) or
        // when circuit source / deps change so we know a rebuild is needed.
        println!("cargo:rerun-if-changed={}", elf.display());
        println!("cargo:rerun-if-changed={}", workspace.join("program/src").display());
        println!("cargo:rerun-if-changed={}", workspace.join("program/Cargo.toml").display());
        println!("cargo:rerun-if-changed={}", workspace.join("types").display());
        return;
    }

    // ELF not found — fall back to sp1_build (requires `cargo prove build` first if the
    // Succinct toolchain is v5.x; that command must be run from circuits/program/).
    sp1_build::build_program_with_args("../program", Default::default());
}
