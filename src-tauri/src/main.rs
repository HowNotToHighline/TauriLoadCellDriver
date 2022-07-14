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
fn connect(state: State<MyState>) -> Result<(), ()> {
    println!("connect");
    let mut driver_option = state.driver.lock().unwrap();

    if driver_option.is_some() {
        // Already connected
        return Result::Err(());
    }

    match LabJack::connect("T7", "ETHERNET", "10.0.5.69") {
        Ok(driver) => {
            println!("{driver:?}");
            // state.inner().driver = driver;
            *driver_option = Some(Box::new(driver));
            Result::Ok(())
        }
        Err(_e) => {
            // TODO: Use LJM_ErrorToString
            println!("An error ocurred");
            Result::Err(())
        }
    }
}

#[tauri::command]
fn disconnect(state: State<MyState>) -> Result<(), ()> {
    println!("disconnect");
    let mut driver_option = state.driver.lock().unwrap();

    if let Some(driver) = &*driver_option {
        match LabJack::disconnect(driver.as_ref()) {
            Ok(_) => {
                *driver_option = None;
                Result::Ok(())
            },
            Err(_) => Result::Err(()),
        }
    } else {
        // Not connected
        Result::Err(())
    }
}
