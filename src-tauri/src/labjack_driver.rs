mod liblabjackm_sys;

use crate::labjack_driver::liblabjackm_sys::{
    LJM_NameToAddress, LJM_eStreamRead, LJM_eStreamStart, LJM_eStreamStop,
};
use std::cmp::max;
use std::ffi::CString;
use std::mem::MaybeUninit;
use std::os::raw::c_int;

#[derive(Debug)]
pub struct LabJack {
    // LabJackM
    handle: i32,
    // Calibration
    offset: f64,
    scalar: f64,
    // Streaming related
    scans_per_read: Option<u32>,
}

impl LabJack {
    pub fn connect(
        device_type: &str,
        connection_type: &str,
        identifier: &str,
        offset: f64,
        scalar: f64,
    ) -> Result<LabJack, i32> {
        let device_type = CString::new(device_type).unwrap();
        let connection_type = CString::new(connection_type).unwrap();
        let identifier = CString::new(identifier).unwrap();

        let mut handle = MaybeUninit::<::std::os::raw::c_int>::uninit();

        unsafe {
            match liblabjackm_sys::LJM_OpenS(
                device_type.as_ptr(),
                connection_type.as_ptr(),
                identifier.as_ptr(),
                handle.as_mut_ptr(),
            ) {
                0 => Result::Ok(LabJack {
                    handle: handle.assume_init(),
                    offset,
                    scalar,
                    scans_per_read: None,
                }),
                x => Result::Err(x),
            }
        }
    }

    // Move self so it forces the user to not use the driver again after disconnecting
    // TODO: Maybe move self back if close failed
    pub fn disconnect(self) -> Result<(), i32> {
        unsafe {
            match liblabjackm_sys::LJM_Close(self.handle) {
                0 => Result::Ok(()),
                x => Result::Err(x),
            }
        }
    }

    pub fn tare(&mut self) -> Result<f64, i32> {
        println!("LabJack::tare");
        match self.read_raw() {
            Ok(raw) => {
                self.offset = raw;
                println!("LabJack::tare raw: {raw}");
                Ok(raw)
            },
            Err(e) => Err(e),
        }
    }

    pub fn start_stream(&mut self, samplerate: u32) -> Result<f64, i32> {
        // These are the defaults, but another program might've changed them already
        self.write_name("STREAM_TRIGGER_INDEX", 0.0)?;
        self.write_name("STREAM_CLOCK_SOURCE", 0.0)?;
        self.write_name("STREAM_SETTLING_US", 0.0)?;

        // These are definitely not defaults
        self.write_name(
            "STREAM_RESOLUTION_INDEX",
            LabJack::optimal_resolution_index(samplerate),
        )?;
        self.write_name("AIN0_NEGATIVE_CH", 1.0)?;
        self.write_name("AIN0_RANGE", 0.1)?;

        let scans_per_read = max(samplerate / 10, 1);
        self.scans_per_read = Some(scans_per_read);

        let mut samplerate = samplerate as f64;

        let scan_list = [LabJack::name_to_address("AIN0")?];

        unsafe {
            match LJM_eStreamStart(
                self.handle,
                scans_per_read as c_int,
                1,
                scan_list.as_ptr(),
                &mut samplerate,
            ) {
                0 => Ok(samplerate),
                e => Err(e),
            }
        }
    }

    pub fn stop_stream(&self) -> Result<(), i32> {
        unsafe {
            match LJM_eStreamStop(self.handle) {
                0 => Ok(()),
                e => Err(e),
            }
        }
    }

    pub fn stream_read(&self) -> Result<Vec<f64>, i32> {
        let mut device_backlog = MaybeUninit::<::std::os::raw::c_int>::uninit();
        let mut ljm_backlog = MaybeUninit::<::std::os::raw::c_int>::uninit();

        let mut data = vec![0.0; self.scans_per_read.ok_or(0)? as usize];

        unsafe {
            match LJM_eStreamRead(
                self.handle,
                data.as_mut_ptr(),
                device_backlog.as_mut_ptr(),
                ljm_backlog.as_mut_ptr(),
            ) {
                0 => {
                    for sample in &mut data {
                        *sample = (*sample - self.offset) * self.scalar;
                    }
                    Ok(data)
                }
                e => Err(e),
            }
        }
    }

    fn read_raw(&self) -> Result<f64, i32> {
        self.write_name("AIN0_RANGE", 0.01)?;
        // https://labjack.com/support/datasheets/t-series/appendix-a-1#adc-conversions
        // Resolution index 12 takes 159 ms, but provides 19.7 bits of resolution
        // This should even out pretty much all noise in the system
        self.write_name("AIN0_RESOLUTION_INDEX", 12.0)?;
        self.read_name("AIN0")
    }

    fn write_name(&self, name: &str, value: f64) -> Result<(), i32> {
        let name = CString::new(name).unwrap();

        unsafe {
            match liblabjackm_sys::LJM_eWriteName(self.handle, name.as_ptr(), value) {
                0 => Result::Ok(()),
                x => Result::Err(x),
            }
        }
    }

    fn read_name(&self, name: &str) -> Result<f64, i32> {
        let name = CString::new(name).unwrap();
        let mut value = MaybeUninit::<f64>::uninit();

        unsafe {
            match liblabjackm_sys::LJM_eReadName(self.handle, name.as_ptr(), value.as_mut_ptr()) {
                0 => Result::Ok(value.assume_init()),
                x => Result::Err(x),
            }
        }
    }

    fn optimal_resolution_index(samplerate: u32) -> f64 {
        // https://labjack.com/support/datasheets/t-series/appendix-a-1#t7-stream-rates
        match samplerate {
            x if x <= 600 => 8.0,
            x if x <= 1200 => 7.0,
            x if x <= 2500 => 6.0,
            x if x <= 5500 => 5.0,
            x if x <= 11000 => 4.0,
            x if x <= 22000 => 3.0,
            x if x <= 48000 => 2.0,
            _ => 1.0,
        }
    }

    fn name_to_address(name: &str) -> Result<::std::os::raw::c_int, i32> {
        let name = CString::new(name).unwrap();
        let mut address = MaybeUninit::<::std::os::raw::c_int>::uninit();
        let mut _type = MaybeUninit::<::std::os::raw::c_int>::uninit();

        unsafe {
            match LJM_NameToAddress(name.as_ptr(), address.as_mut_ptr(), _type.as_mut_ptr()) {
                0 => Ok(address.assume_init()),
                e => Err(e),
            }
        }
    }
}
