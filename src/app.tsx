import {Logo} from './logo'
import {invoke} from "@tauri-apps/api/tauri";
import {createRef, useState} from "preact/compat";
import {ComponentChildren} from "preact";

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
      offset: 0,
      scalar: 1,
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
      await invoke("start", {tag: "", samplerate: 1000});
    } catch(_e) {}
    setState(state => ({...state, started: false}));
  }

  const stop = async () => {
    await invoke("stop");
  }

  return (
    <div style={{display: "flex", height: "100%", margin: "8px"}}>
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
          <input type={"number"} ref={sampleRateRef}/>
        </LabeledItem>

        <LabeledItem label={"Actual samplerate"}>
          <input type={"text"} disabled value={"1000Hz"}/>
        </LabeledItem>

        <LabeledItem label={"Trigger force"}>
          <input type={"text"}/>
        </LabeledItem>

        <LabeledItem label={"Stop force"}>
          <input type={"text"}/>
        </LabeledItem>

        <LabeledItem label={"Pre record time"}>
          <input type={"text"}/>
        </LabeledItem>

        <LabeledItem label={"Post record time"}>
          <input type={"text"}/>
        </LabeledItem>

        <LabeledItem label={"Label"}>
          <input type={"text"} ref={labelRef}/>
        </LabeledItem>

        <LabeledItem label={<button style={{width: "100%"}} onClick={tare}>Zero</button>}>
          {started ?
            <button style={{width: "100%"}} onClick={stop} disabled={busy}>Stop</button>
            :
            <button style={{width: "100%"}} onClick={start} disabled={busy}>Start</button>
          }
        </LabeledItem>

      </div>
      <div style={{flexGrow: 3, backgroundColor: "blue"}}>b</div>
    </div>
    // <>
    //   <Logo />
    //   <p>Hello Vite + Preact!</p>
    //   <p>
    //     <a
    //       class="link"
    //       href="https://preactjs.com/"
    //       target="_blank"
    //       rel="noopener noreferrer"
    //     >
    //       Learn Preact
    //     </a>
    //   </p>
    // </>
  )
}
