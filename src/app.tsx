import { Logo } from './logo'
import { invoke } from "@tauri-apps/api/tauri";

export function App() {
  return (
    <>
      <Logo />
      <p>Hello Vite + Preact!</p>
      <p>
        <a
          class="link"
          href="https://preactjs.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Preact
        </a>
        <br />
        <button onclick={() => invoke("connect")}>
          Connect
        </button>        <br />
        <button onclick={() => invoke("disconnect")}>
          Disconnect
        </button>
      </p>
    </>
  )
}
