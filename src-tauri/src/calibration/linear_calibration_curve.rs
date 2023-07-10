use super::{CalibrationPoint, CalibrationCurve};

#[derive(Debug)]
pub struct LinearCalibrationCurve {
    offset: f64,
    scalar: f64,
}

impl CalibrationCurve for LinearCalibrationCurve {
    fn new(_points: Vec<CalibrationPoint>) -> Self {
        // TODO: Do linear regression on line
        LinearCalibrationCurve {
            offset: 0.0,
            scalar: 0.0,
        }
    }

    fn apply(&self, raw: f64) -> f64 {
        (raw - self.offset) * self.scalar
    }

    fn tare(&mut self, raw: f64) {
        self.offset = raw;
    }
}
