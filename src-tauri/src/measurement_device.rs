pub trait MeasurementDevice {
    fn tare() -> Result<(), Box<dyn std::error::Error>>;
    fn start_stream(&mut self, samplerate: u32) -> Result<f32, Box<dyn std::error::Error>>;
    fn stop_stream(&mut self) -> Result<f32, Box<dyn std::error::Error>>;
    fn stream_read(&mut self) -> Result<f32, Box<dyn std::error::Error>>;
    fn read_single(&mut self) -> Result<f32, Box<dyn std::error::Error>>;
    fn read_raw(&mut self, raw: bool) -> Result<f32, Box<dyn std::error::Error>>;
}
