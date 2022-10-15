import {BaseDirectory, createDir, readTextFile, writeTextFile} from '@tauri-apps/api/fs';
import {useEffect, useState} from "preact/compat";
import defaultConfig from "./config.json";

export function useDrivers() {
  const [config, setConfig] = useState<{
    [key: string]: {
      type: "LabJack",
      displayName: string,
      scalar: number,
      offset: number,
    } | {
      type: "Dummy",
      displayName: string,
    },
  }>({});

  useEffect(() => {
    readTextFile('drivers.json', { dir: BaseDirectory.App })
      .then(contents => JSON.parse(contents))
      .then(parsed => setConfig(parsed as any))
      .catch(() => setConfig(defaultConfig)); // Config file doesn't exist, use fallback
  }, []);

  const driverList = Object.entries(config).map(([id, {displayName}]) => ([id, displayName]));
  const getDriverConfig = (id: string) => {
    if(!config.hasOwnProperty(id)) throw new Error("No such driver");
    const a = config[id] as any;
    if(a.driver === "LabJack") {
      return {
        driver: "LabJack",
        device_type: a.device_type,
        connection_type: a.connection_type,
        identifier: a.identifier,
        offset: a.offset,
        scalar: a.scalar,
      };
    } else {
      return {
        driver: "Dummy",
      }
    }
  }
  const setCalibration = async (id: string, scalar: number, offset: number) => {
    if(!config.hasOwnProperty(id)) throw new Error("No such driver");
    const driverConfig = config[id];
    if(driverConfig.type === "Dummy") throw new Error("Dummy driver can't be calibrated");
    const newConfig = {...config, [id]: {...driverConfig, scalar, offset}};

    await createDir('test', { dir: BaseDirectory.App, recursive: true });
    await writeTextFile('drivers.json', JSON.stringify(newConfig), { dir: BaseDirectory.App });
    setConfig(newConfig);
  }

  return {driverList, getDriverConfig, setCalibration};
}
