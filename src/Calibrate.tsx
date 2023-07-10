import { LabeledItem } from "./LabeledItem";
import { createRef, useState } from "preact/compat";
import { invoke } from "@tauri-apps/api/tauri";

export type CalibrationPoint = { force: number; raw: number };
type Props = {
  cancel(): void;
  finish(points: CalibrationPoint[]): void;
};

export const Calibrate = ({ cancel, finish }: Props) => {
  let [points, setPoints] = useState<CalibrationPoint[]>([]);
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
        <button style={{ width: "100%" }} onClick={() => finish(points)}>
          Finish
        </button>
      </LabeledItem>
    </>
  );
};
