#[derive(serde::Deserialize)]
pub struct CalibrationPoint {
    force: f64,
    raw: f64,
}

pub trait CalibrationCurve {
    fn new(points: Vec<CalibrationPoint>) -> Self;
    fn apply(&self, raw: f64) -> f64;
    fn tare(&mut self, raw: f64);
}
