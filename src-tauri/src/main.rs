#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

mod labjack_driver;

use std::sync::{Arc, Mutex};
use tauri::State;
use crate::labjack_driver::LabJack;

#[derive(Debug)]
pub struct MyState {
    driver: Arc<Mutex<Option<Box<LabJack>>>>,
}

fn main() {
    let context = tauri::generate_context!();
    tauri::Builder::default()
        .manage(MyState {
            driver: Arc::new(Mutex::new(None)),
        })
        .menu(if cfg!(target_os = "macos") {
            tauri::Menu::os_default(&context.package_info().name)
        } else {
            tauri::Menu::default()
        })
        .invoke_handler(tauri::generate_handler![connect, disconnect])
        .run(context)
        .expect("error while running tauri application");
}

#[tauri::command]
fn connect(state: State<MyState>) -> bool {
    println!("connect");
    let mut driver_option = state.driver.lock().unwrap();

    if let Some(_) = *driver_option {
        // Already connected
        return false;
    }

    match LabJack::connect("T7", "ETHERNET", "10.0.5.69") {
        Ok(driver) => {
            println!("{driver:?}");
            // state.inner().driver = driver;
            *driver_option = Some(Box::new(driver));
            true
        }
        Err(_e) => {
            // TODO: Use LJM_ErrorToString
            println!("An error ocurred");
            false
        }
    }
}

#[tauri::command]
fn disconnect(state: State<MyState>) -> bool {
    println!("disconnect");
    let mut driver_option = state.driver.lock().unwrap();

    if let Some(driver) = &*driver_option {
        match LabJack::disconnect(driver.as_ref()) {
            Ok(_) => {
                *driver_option = None;
                true
            },
            Err(_) => false,
        }
    } else {
        // Not connected
        false
    }
}
