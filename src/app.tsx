import {invoke} from "@tauri-apps/api/tauri";
import {createRef, useEffect, useState} from "preact/compat";
import {ComponentChildren} from "preact";
import {listen} from "@tauri-apps/api/event";
import {Cleanup} from "preact/hooks/src/internal";
import {StreamControls} from "./StreamControls";
import {LabeledItem} from "./LabeledItem";
import {Results} from "./Results";
import {Calibrate} from "./Calibrate";

type Drivers = {
  LabJack: {
    device_type: string,
    connection_type: string,
    identifier: string,
    offset: number,
    scalar: number,
  },
  Dummy: {},
};

type ValueOf<T> = T[keyof T];
type DriverConfig = ValueOf<{
  [key in keyof Drivers]: {
  driver: key,
} & Drivers[key]
}>

const configs: Array<{
  name: string,
  driverConfig: DriverConfig,
}> = [
  {
    name: "LabJack Jetse [ETHERNET]",
    driverConfig: {
      driver: "LabJack",
      device_type: "T7",
      connection_type: "ETHERNET",
      identifier: "10.0.5.69",
      offset: 0.000033,
      scalar: 1 / 0.000394 * 10,
      // scalar: 1e10,
    },
  },
  {
    name: "LabJack Ryan [ETHERNET]",
    driverConfig: {
      driver: "LabJack",
      device_type: "T7",
      connection_type: "ETHERNET",
      identifier: "10.0.5.69",
      offset: -0.37809891,
      scalar: 3230.372162717,
    },
  },
  /*{
    name: "Dummy",
    driverConfig: {driver: "Dummy"},
  },*/
]

export function App() {
  const [{connected, connecting, started, calibrating}, setState] = useState({
    connected: false,
    connecting: false,
    started: false,
    calibrating: false,
  });
  const busy = connecting || started;

  const configRef = createRef();

  const connect = async () => {
    setState(state => ({...state, connected: false, connecting: true}));
    try {
      await invoke("connect", {driverConfig: configs[configRef.current.value].driverConfig});
      setState(state => ({...state, connected: true, connecting: false}));
    } catch (e) {
      setState(state => ({...state, connected: false, connecting: false}));
    }
  }

  const disconnect = async () => {
    setState(state => ({...state, connected: true, connecting: true}));
    try {
      await invoke("disconnect");
      setState(state => ({...state, connected: false, connecting: false}));
    } catch (e) {
      setState(state => ({...state, connected: true, connecting: false}));
    }
  }

  return (
    <div style={{display: "flex", height: "100%", padding: "8px", boxSizing: "border-box"}}>
      <div style={{width: "25%", minWidth: "450px"/*, backgroundColor: "red"*/}}>
        <LabeledItem label={"Loadcell:"}>
          <select ref={configRef}>
            {configs.map(({name}, i) =>
              <option value={i}>{name}</option>
            )}
          </select>
        </LabeledItem>
        <LabeledItem label={""}>
          {connected ?
            <>
              <button onClick={disconnect} disabled={busy}>
                Disconnect
              </button>
              <button onclick={() => setState(x => ({...x, calibrating: true}))} disabled={busy || calibrating}>
                Calibrate
              </button>
            </>
            :
            <button onClick={connect} disabled={busy}>
              Connect
            </button>}
        </LabeledItem>

        <hr/>

        {calibrating ?
          <Calibrate cancel={() => setState(x => ({...x, calibrating: false}))}
                     finish={(parameters) => {
                       // TODO: Store new parameters
                       setState(x => ({...x, calibrating: false}));
                     }}/> :
          <StreamControls disabled={busy || !connected} connected={connected}
                          startedStream={() => setState(x => ({...x, started: true}))}
                          stoppedStream={() => setState(x => ({...x, started: false}))}/>
        }

      </div>
      <div style={{flexGrow: 1, backgroundColor: "blue"}}>
        <Results/>
      </div>
    </div>
  )
}
