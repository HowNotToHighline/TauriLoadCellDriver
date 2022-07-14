import {Logo} from './logo'
import {invoke} from "@tauri-apps/api/tauri";
import {useState} from "preact/compat";
import {ComponentChildren} from "preact";

type Drivers = {
  labjack: {
    model: string,
  },
  dummy: {},
};

type ValueOf<T> = T[keyof T];
type DriverConfig = ValueOf<{
  [key in keyof Drivers]: {
    driver: key,
    config: Drivers[key],
  }
}>

const configs: Array<{
  name: string,
} & DriverConfig> = [
  {
    name: "LabJack Jetse [USB]",
    driver: "labjack",
    config: {
      model: "T7",
    },
  },
  {
    name: "Dummy",
    driver: "dummy",
    config: {},
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
  const [[connected, busy], setState] = useState([false, false]);

  const connect = async () => {
    setState([false, true]);
    try {
      await invoke("connect");
      setState([true, false]);
    } catch (e) {
      setState([false, false]);
    }
  }

  const disconnect = async () => {
    setState([true, true]);
    try {
      await invoke("disconnect");
      setState([false, false]);
    } catch (e) {
      setState([true, false]);
    }
  }

  return (
    <div style={{display: "flex", height: "100%", margin: "8px"}}>
      <div style={{width: "25%", minWidth: "350px"/*, backgroundColor: "red"*/}}>
        <LabeledItem label={"Loadcell:"}>
          <select>
            {configs.map(({name}, i) =>
              <option value={i}>{name}</option>
            )}
          </select>
        </LabeledItem>
        <LabeledItem label={""}>
          {connected ?
            <button onClick={disconnect} disabled={busy}>
              Disconnect
            </button>
            :
            <button onClick={connect} disabled={busy}>
              Connect
            </button>}
        </LabeledItem>
        <hr />

        <LabeledItem label={"Samplerate"}>
          <input type={"number"} />
        </LabeledItem>

        <LabeledItem label={"Actual samplerate"}>
          <input type={"text"} disabled value={"1000Hz"} />
        </LabeledItem>

        <LabeledItem label={"Trigger force"}>
          <input type={"text"} />
        </LabeledItem>

        <LabeledItem label={"Stop force"}>
          <input type={"text"} />
        </LabeledItem>

        <LabeledItem label={"Pre record time"}>
          <input type={"text"} />
        </LabeledItem>

        <LabeledItem label={"Post record time"}>
          <input type={"text"} />
        </LabeledItem>

        <LabeledItem label={"Label"}>
          <input type={"text"} />
        </LabeledItem>

        <LabeledItem label={<button style={{width: "100%"}}>Zero</button>}>
          <button style={{width: "100%"}}>Start</button>
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
