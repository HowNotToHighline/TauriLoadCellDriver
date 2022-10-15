import {LabeledItem} from "./LabeledItem";
import {createRef, useState} from "preact/compat";
import {invoke} from "@tauri-apps/api/tauri";

type Parameters = { scalar: number, offset: number };
type Point = { force: number, raw: number };
type Props = {
  cancel(): void,
  finish(parameters: Parameters): void,
};

function calculateParameters(points: Point[]): Parameters {
  if(points.length < 2) throw new Error("Need at least two points for a calibration");

  const averageForce = points.reduce((acc, {force}) => force + acc, 0) / points.length;
  const averageRaw = points.reduce((acc, {raw}) => raw + acc, 0) / points.length;
  const varianceForce = points.reduce((acc, {force}) => (force - averageForce) ** 2 + acc, 0);
  const covarianceForceRaw = points.reduce((acc, {force, raw}) => (force - averageForce) * (raw - averageRaw) + acc, 0);

  const slope = covarianceForceRaw / varianceForce;
  const intercept = averageRaw - slope * averageForce;

  return {
    scalar: slope,
    offset: -intercept/slope,
  };
}

export const Calibrate = ({cancel, finish}: Props) => {
  let [points, setPoints] = useState<Point[]>([]);
  const forceRef = createRef();

  return <>
    {points.map(({raw, force}) =>
      <LabeledItem label={`${force}kN`}>{raw.toExponential(5)}</LabeledItem>
    )}
    <LabeledItem label={"Force"}>
      <input type={"number"} ref={forceRef}/>
    </LabeledItem>
    <LabeledItem label={""}>
      <button onclick={
        async () => {
          const raw: number = await invoke("tare");
          setPoints(x => x.concat({force: parseFloat(forceRef.current.value), raw}));
        }
      }>Add point
      </button>
    </LabeledItem>
    <LabeledItem label={<button style={{width: "100%"}} onclick={() => cancel()}>Cancel</button>}>
      <button style={{width: "100%"}} onclick={() => finish(calculateParameters(points))}>Finish</button>
    </LabeledItem>
  </>;
}
