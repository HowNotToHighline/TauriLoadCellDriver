fn main() {
    println!("cargo:rustc-link-lib=LabJackM");
    tauri_build::build()
}
