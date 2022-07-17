import {invoke} from "@tauri-apps/api/tauri";
import {createRef, useEffect, useState} from "preact/compat";
import {ComponentChildren} from "preact";
import {listen} from "@tauri-apps/api/event";
import {Cleanup} from "preact/hooks/src/internal";

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
    name: "LabJack Jetse [USB]",
    driverConfig: {
      driver: "LabJack",
      device_type: "T7",
      connection_type: "ETHERNET",
      identifier: "10.0.5.69",
      offset: 0.000033,
      scalar: 1/0.000394,
      // scalar: 1e10,
    },
  },
  {
    name: "Dummy",
    driverConfig: {driver: "Dummy"},
  },
]

const LabeledItem = ({label, children}: { label: ComponentChildren, children: ComponentChildren }) =>
  <div style={{width: "100%", marginBottom: "4px"}}>
    <div style={{width: "50%", display: "inline-block"/*, backgroundColor: "green"*/, margin: "auto"}}>{label}</div>
    <div style={{width: "50%", display: "inline-block"/*, backgroundColor: "orange"*/}}>
      {children}
    </div>
  </div>;


export function App() {
  const [{connected, busy, started}, setState] = useState({connected: false, busy: false, started: false});
  const [{peakForce, latestForce}, setForce] = useState({
    peakForce: Number.NEGATIVE_INFINITY,
    latestForce: Number.NEGATIVE_INFINITY
  });

  const configRef = createRef();
  const sampleRateRef = createRef();
  const labelRef = createRef();

  const connect = async () => {
    setState(state => ({...state, connected: false, busy: true}));
    try {
      await invoke("connect", {driverConfig: configs[configRef.current.value].driverConfig});
      setState(state => ({...state, connected: true, busy: false}));
    } catch (e) {
      setState(state => ({...state, connected: false, busy: false}));
    }
  }

  const disconnect = async () => {
    setState(state => ({...state, connected: true, busy: true}));
    try {
      await invoke("disconnect");
      setState(state => ({...state, connected: false, busy: false}));
    } catch (e) {
      setState(state => ({...state, connected: true, busy: false}));
    }
  }

  const tare = async () => {
    await invoke("tare");
  }

  const start = async () => {
    setState(state => ({...state, started: true}));
    try {
      await invoke("start", {tag: labelRef.current.value, samplerate: 1000});
    } catch (_e) {
    }
    setState(state => ({...state, started: false}));
  }

  const stop = async () => {
    await invoke("stop");
  }

  useEffect(() => {
    const ughNames: { unlisten?: Cleanup, cleaned?: true } = {};
    listen<{ peak: number, latest: number}>('peak-force', event => {
      setForce({
        peakForce: event.payload.peak,
        latestForce: event.payload.latest,
      })
    }).then(unlisten => {
      ughNames.unlisten = unlisten;
      if (ughNames.cleaned) unlisten();
    });

    return () => {
      ughNames.unlisten?.();
      ughNames.cleaned = true;
    };
  });

  return (
    <div style={{display: "flex", height: "100%", padding: "8px", boxSizing: "border-box"}}>
      <div style={{width: "25%", minWidth: "350px"/*, backgroundColor: "red"*/}}>
        <LabeledItem label={"Loadcell:"}>
          <select ref={configRef}>
            {configs.map(({name}, i) =>
              <option value={i}>{name}</option>
            )}
          </select>
        </LabeledItem>
        <LabeledItem label={""}>
          {connected ?
            <button onClick={disconnect} disabled={busy || started}>
              Disconnect
            </button>
            :
            <button onClick={connect} disabled={busy || started}>
              Connect
            </button>}
        </LabeledItem>
        <hr/>

        <LabeledItem label={"Samplerate"}>
          <input type={"number"} ref={sampleRateRef} disabled={busy || !connected || started}/>
        </LabeledItem>

        <LabeledItem label={"Actual samplerate"}>
          <input type={"text"} disabled value={"1000Hz"}/>
        </LabeledItem>

        <LabeledItem label={"Trigger force"}>
          <input type={"text"} disabled/>
        </LabeledItem>

        <LabeledItem label={"Stop force"}>
          <input type={"text"} disabled/>
        </LabeledItem>

        <LabeledItem label={"Pre record time"}>
          <input type={"text"} disabled/>
        </LabeledItem>

        <LabeledItem label={"Post record time"}>
          <input type={"text"} disabled/>
        </LabeledItem>

        <LabeledItem label={"Label"}>
          <input type={"text"} ref={labelRef} disabled={busy || !connected || started}/>
        </LabeledItem>

        <LabeledItem label={<button style={{width: "100%"}} onClick={tare} disabled={busy || !connected}>Zero</button>}>
          {started ?
            <button style={{width: "100%"}} onClick={stop} disabled={busy || !connected}>Stop</button>
            :
            <button style={{width: "100%"}} onClick={start} disabled={busy || !connected}>Start</button>
          }
        </LabeledItem>

      </div>
      <div style={{flexGrow: 1, backgroundColor: "blue"}}>
        <div style={{width: "100%"}}>
          <LabeledItem label={"peak"}>
            <input value={peakForce/*.toFixed(2)*/} disabled/>
          </LabeledItem>
          <LabeledItem label={"latest"}>
            <input value={latestForce/*.toFixed(2)*/} disabled/>
          </LabeledItem>
        </div>
      </div>
    </div>
  )
}
