import {
  BaseDirectory,
  createDir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/api/fs";
import { useEffect, useState } from "preact/compat";
import { configType, defaultConfig } from "./defaultConfig";
import { CalibrationPoint } from "./Calibrate";

export function useDrivers() {
  const [config, setConfig] = useState<configType>({});

  useEffect(() => {
    readTextFile("drivers.json", { dir: BaseDirectory.App })
      .then((contents) => JSON.parse(contents))
      .then((parsed) => setConfig(parsed as any))
      .catch(() => setConfig(defaultConfig)); // Config file doesn't exist, use fallback
  }, []);

  const driverList = Object.entries(config).map(([id, { displayName }]) => [
    id,
    displayName,
  ]);
  const getDriverConfig = (id: string) => {
    if (!config.hasOwnProperty(id)) throw new Error("No such driver");
    const a = config[id];
    switch(a.driver) {
      case "LabJack":
        return {
          driver: "LabJack",
          device_type: a.deviceType,
          connection_type: a.connectionType,
          identifier: a.identifier,
          calibration_points: a.calibrationPoints,
        };
      case "Dummy":
        return {
          driver: "Dummy",
        };
    }
  };

  const setCalibration = async (
    id: string,
    calibrationPoints: CalibrationPoint[],
  ) => {
    if (!config.hasOwnProperty(id)) throw new Error("No such driver");
    const driverConfig = config[id];
    if (driverConfig.driver === "Dummy")
      throw new Error("Dummy driver can't be calibrated");
    const newConfig = {
      ...config,
      [id]: { ...driverConfig, calibrationPoints },
    };

    await createDir("test", { dir: BaseDirectory.App, recursive: true });
    await writeTextFile("drivers.json", JSON.stringify(newConfig), {
      dir: BaseDirectory.App,
    });
    setConfig(newConfig);
  };

  return { driverList, getDriverConfig, setCalibration };
}
