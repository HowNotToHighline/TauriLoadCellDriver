import {createRef, useState} from "preact/compat";
import {invoke} from "@tauri-apps/api/tauri";
import {LabeledItem} from "./LabeledItem";

type Props = {
  disabled: boolean,
  connected: boolean,
  startedStream(): void,
  stoppedStream(): void,
}

export const StreamControls = ({disabled, connected, startedStream, stoppedStream}: Props) => {
  const [started, setStarted] = useState(false);

  const sampleRateRef = createRef();
  const labelRef = createRef();

  const tare = async () => {
    await invoke("tare");
  }

  const start = async () => {
    startedStream();
    setStarted(true);
    try {
      await invoke("start", {tag: labelRef.current.value, samplerate: parseInt(sampleRateRef.current.value)});
    } catch (e) {
      console.error(e);
    }
    stoppedStream();
    setStarted(false);
  }

  const stop = async () => {
    await invoke("stop");
  }

  return <>
    <LabeledItem label={"Samplerate"}>
      <input type={"number"} ref={sampleRateRef} disabled={disabled || !connected || started}/>
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
      <input type={"text"} ref={labelRef} disabled={disabled || !connected || started}/>
    </LabeledItem>

    <LabeledItem label={<button style={{width: "100%"}} onClick={tare} disabled={disabled || !connected}>Zero</button>}>
      {started ?
        <button style={{width: "100%"}} onClick={stop} disabled={disabled || !connected}>Stop</button>
        :
        <button style={{width: "100%"}} onClick={start} disabled={disabled || !connected}>Start</button>
      }
    </LabeledItem>
  </>;
};
