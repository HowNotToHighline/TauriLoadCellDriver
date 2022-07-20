#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod labjack_driver;

use crate::labjack_driver::LabJack;
use chrono::{DateTime, Utc};
use csv::Writer;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{State, Window};

#[derive(Debug)]
pub struct MyState {
    driver: Arc<Mutex<Option<LabJack>>>,
    thread_stop: Arc<Mutex<Option<Arc<AtomicBool>>>>,
}

#[derive(serde::Deserialize)]
#[serde(tag = "driver")]
pub enum DriverConfig {
    Dummy {},
    LabJack {
        device_type: String,
        connection_type: String,
        identifier: String,
        offset: f64,
        scalar: f64,
    },
}

#[derive(Clone, serde::Serialize)]
struct ForceUpdateMessage {
    peak: f64,
    latest: f64,
}

fn main() {
    let context = tauri::generate_context!();
    tauri::Builder::default()
        .manage(MyState {
            driver: Arc::new(Mutex::new(None)),
            thread_stop: Arc::new(Mutex::new(None)),
        })
        .menu(if cfg!(target_os = "macos") {
            tauri::Menu::os_default(&context.package_info().name)
        } else {
            tauri::Menu::default()
        })
        .invoke_handler(tauri::generate_handler![
            connect, disconnect, start, stop, tare
        ])
        .run(context)
        .expect("error while running tauri application");
}

#[tauri::command]
fn connect(state: State<MyState>, driver_config: DriverConfig) -> Result<(), ()> {
    println!("connect");
    let mut driver_option = state.driver.lock().unwrap();

    if driver_option.is_some() {
        // Already connected
        return Result::Err(());
    }

    match driver_config {
        DriverConfig::LabJack {
            device_type,
            connection_type,
            identifier,
            offset,
            scalar,
        } => {
            match LabJack::connect(&device_type, &connection_type, &identifier, offset, scalar) {
                Ok(driver) => {
                    println!("{driver:?}");
                    // state.inner().driver = driver;
                    *driver_option = Some(driver);
                    Result::Ok(())
                }
                Err(_e) => {
                    // TODO: Use LJM_ErrorToString
                    println!("An error occurred");
                    Result::Err(())
                }
            }
        }
        _ => Err(()),
    }
}

#[tauri::command]
fn disconnect(state: State<MyState>) -> Result<(), ()> {
    println!("disconnect");
    let mut driver_option = state.driver.lock().unwrap();

    if let Some(driver) = driver_option.take() {
        match driver.disconnect() {
            Ok(_) => Result::Ok(()),
            Err(_) => Result::Err(()),
        }
    } else {
        // Not connected
        Result::Err(())
    }
}

#[tauri::command]
async fn start(
    state: State<'_, MyState>,
    window: Window,
    tag: String,
    samplerate: u32,
) -> Result<(), i32> {
    println!("start 1");

    let now: DateTime<Utc> = Utc::now();

    let dir = format!(".{s}logs{s}",s = std::path::MAIN_SEPARATOR);
    println!("dir: {dir}");

    match std::fs::create_dir_all(&dir) {
        Ok(_) => (),
        Err(_) => return Err(0),
    }

    let path = format!(
        "{dir}{datetime}_{tag}.csv",
        datetime = now.format("%d-%m-%Y_%H-%M-%S")
    );

    let mut writer = match Writer::from_path(path) {
        Ok(writer) => writer,
        Err(_) => return Err(0),
    };

    println!("start 2");

    // This is in a separate block so the mutex's get unlocked automatically
    let stop = Arc::new(AtomicBool::new(false));
    let mut driver;
    {
        let mut driver_option = state.driver.lock().unwrap();
        let mut thread_stop_option = state.thread_stop.lock().unwrap();

        // Can't start if not connected
        if driver_option.is_none() {
            return Err(0);
        }

        // If thread already running, refuse to start
        if thread_stop_option.is_some() {
            return Err(0);
        }

        // NOTE: This takes ownership of the driver, thus setting the state to None
        driver = driver_option.take().ok_or(0)?;
        driver.start_stream(samplerate);
        *thread_stop_option = Some(stop.clone());
    }

    println!("start 3");

    // TODO: Actually write header with values
    writer.write_record(&["00:00:00"]); // Serial nr
    writer.write_record(&[now.format("%d:%m:%y").to_string()]); // Date
    writer.write_record(&[now.format("%H:%M:%S").to_string()]); // Time
    writer.write_record(&["LogNo=001"]); // Can we use the tag here? Or should it always be an int?
    writer.write_record(&["Unit=kN"]);
    writer.write_record(&["Mode=ABS"]);
    writer.write_record(&["RelZero=0"]); // Can this be omitted?
    writer.write_record(&[format!("Speed={samplerate}")]);
    writer.write_record(&["Trig=0"]); //
    writer.write_record(&["Stop=0"]); // What if there's no stop trigger force?
    writer.write_record(&["Pre=0"]); //
    writer.write_record(&["Catch=0"]); //
    writer.write_record(&["Total=0"]); // Also includes post time?

    println!("start 4");

    let mut error = Ok(());
    let mut peak_force = f64::NEG_INFINITY;
    while !stop.load(Ordering::Relaxed) {
        let data = match driver.stream_read() {
            Ok(data) => data,
            Err(e) => {
                println!("start error {e}");
                error = Err(e);
                break;
            }
        };

        let mut local_peak_force = f64::NEG_INFINITY;
        for sample in data {
            writer.write_record(&[format!("{sample:.2}")]);
            if sample > local_peak_force {
                local_peak_force = sample;
            }
        }

        if local_peak_force > peak_force {
            peak_force = local_peak_force;
        }
        window.emit(
            "peak-force",
            ForceUpdateMessage {
                peak: peak_force,
                latest: local_peak_force,
            },
        );

        // TODO: Facilitate real time graph
        // TODO: Auto trigger
        // TODO: Pre and post trigger store (ring buffer)
    }

    driver.stop_stream();
    // The writer automatically closes when going out of scope

    {
        let mut driver_option = state.driver.lock().unwrap();
        let mut thread_stop_option = state.thread_stop.lock().unwrap();

        *driver_option = Some(driver);
        *thread_stop_option = None;
    }

    println!("start 6");

    error
}

#[tauri::command]
fn stop(state: State<MyState>) -> Result<(), ()> {
    let mut thread_stop_option = state.thread_stop.lock().unwrap();
    let thread_stop = thread_stop_option.take().ok_or(())?;

    thread_stop.store(true, Ordering::Relaxed);

    Ok(())
}

#[tauri::command]
fn tare(state: State<MyState>) -> Result<f64, ()> {
    let mut driver_option = state.driver.lock().unwrap();
    let mut driver = driver_option.as_mut().ok_or(())?;

    match driver.tare() {
        Ok(raw) => Ok(raw),
        Err(_) => Err(()),
    }
}
