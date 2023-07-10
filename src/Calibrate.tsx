import { LabeledItem } from "./LabeledItem";
import { createRef, useState } from "preact/compat";
import { invoke } from "@tauri-apps/api/tauri";

type Parameters = { scalar: number; offset: number };
type Point = { force: number; raw: number };
type Props = {
  cancel(): void;
  finish(parameters: Parameters): void;
};

function calculateParameters(points: Point[]): Parameters {
  if (points.length < 2)
    throw new Error("Need at least two points for a calibration");

  const averageRaw =
    points.reduce((acc, { raw }) => raw + acc, 0) / points.length;
  const averageForce =
    points.reduce((acc, { force }) => force + acc, 0) / points.length;
  const varianceRaw = points.reduce(
    (acc, { raw }) => (raw - averageRaw) ** 2 + acc,
    0,
  );
  const covarianceRawForce = points.reduce(
    (acc, { force, raw }) => (force - averageForce) * (raw - averageRaw) + acc,
    0,
  );

  const slope = covarianceRawForce / varianceRaw;
  const intercept = averageForce - slope * averageRaw;

  return {
    scalar: slope,
    offset: -intercept / slope,
  };
}

export const Calibrate = ({ cancel, finish }: Props) => {
  let [points, setPoints] = useState<Point[]>([]);
  const forceRef = createRef();

  return (
    <>
      {points.map(({ raw, force }) => (
        <LabeledItem label={`${force}kN`}>{raw.toExponential(5)}</LabeledItem>
      ))}
      <LabeledItem label={"Force"}>
        <input type={"number"} ref={forceRef} />
      </LabeledItem>
      <LabeledItem label={""}>
        <button
          onClick={async () => {
            const raw: number = await invoke("tare");
            setPoints((x) =>
              x.concat({ force: parseFloat(forceRef.current.value), raw }),
            );
          }}
        >
          Add point
        </button>
      </LabeledItem>
      <LabeledItem
        label={
          <button style={{ width: "100%" }} onClick={() => cancel()}>
            Cancel
          </button>
        }
      >
        <button
          style={{ width: "100%" }}
          onClick={() => finish(calculateParameters(points))}
        >
          Finish
        </button>
      </LabeledItem>
    </>
  );
};
