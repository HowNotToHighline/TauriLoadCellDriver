import { invoke } from "@tauri-apps/api/tauri";
import { createRef, useEffect, useState } from "preact/compat";
import { StreamControls } from "./StreamControls";
import { LabeledItem } from "./LabeledItem";
import { Results } from "./Results";
import { Calibrate } from "./Calibrate";
import { useDrivers } from "./config";

export function App() {
  const [{ connected, connecting, started, calibrating }, setState] = useState({
    connected: false,
    connecting: false,
    started: false,
    calibrating: false,
  });
  const busy = connecting || started;

  const configRef = createRef();

  const { driverList, getDriverConfig, setCalibration } = useDrivers();

  const connect = async () => {
    setState((state) => ({ ...state, connected: false, connecting: true }));
    try {
      await invoke("connect", {
        driverConfig: getDriverConfig(configRef.current.value),
      });
      setState((state) => ({ ...state, connected: true, connecting: false }));
    } catch (e) {
      setState((state) => ({ ...state, connected: false, connecting: false }));
    }
  };

  const disconnect = async () => {
    setState((state) => ({ ...state, connected: true, connecting: true }));
    try {
      await invoke("disconnect");
      setState((state) => ({ ...state, connected: false, connecting: false }));
    } catch (e) {
      setState((state) => ({ ...state, connected: true, connecting: false }));
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        padding: "8px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{ width: "25%", minWidth: "450px" /*, backgroundColor: "red"*/ }}
      >
        <LabeledItem label={"Loadcell:"}>
          <select ref={configRef}>
            {driverList.map(([id, displayName]) => (
              <option value={id}>{displayName}</option>
            ))}
          </select>
        </LabeledItem>
        <LabeledItem label={""}>
          {connected ? (
            <>
              <button onClick={disconnect} disabled={busy}>
                Disconnect
              </button>
              <button
                onClick={() => setState((x) => ({ ...x, calibrating: true }))}
                disabled={busy || calibrating}
              >
                Calibrate
              </button>
            </>
          ) : (
            <button onClick={connect} disabled={busy}>
              Connect
            </button>
          )}
        </LabeledItem>

        <hr />

        {calibrating ? (
          <Calibrate
            cancel={() => setState((x) => ({ ...x, calibrating: false }))}
            finish={async (points) => {
              await setCalibration(configRef.current.value, points);
              setState((x) => ({ ...x, calibrating: false }));
            }}
          />
        ) : (
          <StreamControls
            disabled={connecting || !connected}
            connected={connected}
            startedStream={() => setState((x) => ({ ...x, started: true }))}
            stoppedStream={() => setState((x) => ({ ...x, started: false }))}
          />
        )}
      </div>
      <div style={{ flexGrow: 1, backgroundColor: "blue" }}>
        <Results />
      </div>
    </div>
  );
}
