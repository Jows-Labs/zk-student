fn main() {
    // Compile the SP1 guest program and make its ELF available via include_elf!.
    // Set SP1_BUILD_SKIP=true to skip during local cargo check / IDE indexing.
    if std::env::var("SP1_BUILD_SKIP").is_ok() {
        // include_elf! expands to include_bytes!(env!("SP1_ELF_...")), so the env var
        // must point to a real file even when skipping. Write a zero-byte stub.
        let out_dir = std::env::var("OUT_DIR").unwrap();
        let stub = format!("{out_dir}/zk-student-circuit.elf");
        std::fs::write(&stub, []).unwrap();
        println!("cargo:rustc-env=SP1_ELF_zk-student-circuit={stub}");
        return;
    }
    sp1_build::build_program_with_args("../program", Default::default());
}
