import { LabeledItem } from "./LabeledItem";
import { useEffect, useState } from "preact/compat";
import { Cleanup } from "preact/hooks/src/internal";
import { listen } from "@tauri-apps/api/event";

export const Results = () => {
  const [{ peakForce, latestForce }, setForce] = useState({
    peakForce: Number.NEGATIVE_INFINITY,
    latestForce: Number.NEGATIVE_INFINITY,
  });

  useEffect(() => {
    const ughNames: { unlisten?: Cleanup; cleaned?: true } = {};
    listen<{ peak: number; latest: number }>("peak-force", (event) => {
      setForce({
        peakForce: event.payload.peak,
        latestForce: event.payload.latest,
      });
    }).then((unlisten) => {
      ughNames.unlisten = unlisten;
      if (ughNames.cleaned) unlisten();
    });

    return () => {
      ughNames.unlisten?.();
      ughNames.cleaned = true;
    };
  });

  return (
    <div style={{ width: "100%", margin: "8px" }}>
      <LabeledItem label={"peak"}>
        <input value={peakForce /*.toFixed(2)*/} disabled />
      </LabeledItem>
      <LabeledItem label={"latest"}>
        <input value={latestForce /*.toFixed(2)*/} disabled />
      </LabeledItem>
    </div>
  );
};
