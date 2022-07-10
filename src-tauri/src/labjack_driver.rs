mod liblabjackm_sys;

use std::ffi::CString;
use std::mem::MaybeUninit;

#[derive(Debug)]
pub struct LabJack {
    handle: i32,
}

impl LabJack {
    pub fn connect(device_type: &str, connection_type: &str, identifier: &str) -> Result<LabJack, i32> {
        let device_type = CString::new(device_type).unwrap();
        let connection_type = CString::new(connection_type).unwrap();
        let identifier = CString::new(identifier).unwrap();

        let mut handle = MaybeUninit::<::std::os::raw::c_int>::uninit();

        unsafe {
            match liblabjackm_sys::LJM_OpenS(device_type.as_ptr(), connection_type.as_ptr(), identifier.as_ptr(), handle.as_mut_ptr()) {
                0 => Result::Ok(LabJack { handle: handle.assume_init() }),
                x => Result::Err(x),
            }
        }
    }

    pub fn disconnect(labjack: &LabJack) -> Result<(), i32> {
        unsafe {
            match liblabjackm_sys::LJM_Close(labjack.handle) {
                0 => Result::Ok(()),
                x => Result::Err(x),
            }
        }
    }
}
