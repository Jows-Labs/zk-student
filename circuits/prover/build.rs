fn main() {
    // Compile the SP1 guest program and make its ELF available via include_elf!.
    // Set SP1_BUILD_SKIP=true to skip during local cargo check / IDE indexing.
    if std::env::var("SP1_BUILD_SKIP").is_ok() {
        return;
    }
    sp1_build::build_program_with_args("../program", Default::default());
}
