fn main() {
    println!("cargo:rustc-link-lib=LabJackM");
    if cfg!(windows) {
        println!("cargo:rustc-link-search=C:\\Program Files (x86)\\LabJack\\Drivers\\64bit");
    }
    tauri_build::build()
}
