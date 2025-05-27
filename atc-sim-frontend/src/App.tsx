import * as React from "react"
import VoiceRecorder from "./components/VoiceRecorder"
import { FlightInfo } from "./components/FlightInfo"
import { CommandLogViewer } from "./components/CommandLog"

export default function App() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "100vw",
        height: "100vh",
      }}
    >
      <div style={{ flex: 1 }}>
        <CommandLogViewer />{" "}
      </div>
      <div style={{ flex: 1 }}>
        <FlightInfo />
      </div>
      <div style={{ flex: 1 }}>
        <VoiceRecorder />{" "}
      </div>
    </div>
  )
}
