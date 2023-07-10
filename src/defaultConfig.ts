import { CalibrationPoint } from "./Calibrate";

export type configType = {
  [key: string]:
    | {
        driver: "LabJack";
        displayName: string;
        deviceType: string;
        connectionType: string;
        identifier: string;
        calibrationPoints: CalibrationPoint[];
      }
    | {
        driver: "Dummy";
        displayName: string;
      };
};

export const defaultConfig: configType = {
  "labjack-jetse-usb": {
    displayName: "LabJack Jetse [USB]",
    driver: "LabJack",
    deviceType: "T7",
    connectionType: "USB",
    identifier: "ANY",
    calibrationPoints: [
      { force: 0, raw: 0 },
      { force: 1, raw: 1 },
    ],
    // "offset": 0.000033,
    // "scalar": 2538.0710659898477
  },
  "labjack-jetse-ethernet": {
    displayName: "LabJack Jetse [ETHERNET]",
    driver: "LabJack",
    deviceType: "T7",
    connectionType: "ETHERNET",
    identifier: "10.0.5.69",
    calibrationPoints: [
      { force: 0, raw: 0 },
      { force: 1, raw: 1 },
    ],
    // "offset": 0.000033,
    // "scalar": 2538.0710659898477
  },
  "labjack-ryan": {
    "displayName": "LabJack Ryan [ETHERNET]",
    "driver": "LabJack",
    "deviceType": "T7",
    "connectionType": "ETHERNET",
    "identifier": "10.0.5.69",
    "calibrationPoints": [
      {"force": 0, "raw": 0},
      {"force": 1, "raw": 1}
    ]
    // "offset": -0.37809891,
    // "scalar": 3230.372162717
  },
  "dummy": {
    "displayName": "Dummy",
    "driver": "Dummy"
  }
};
