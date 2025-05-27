import * as React from "react"
import VoiceRecorder from "./components/VoiceRecorder"
import { FlightInfo } from "./components/FlightInfo"
import { TopNotchSky } from "./components/TopNotchSky"

export default function App() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, height: "100vh", overflow: "hidden" }}>
        <TopNotchSky />
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 0.5, padding: "20px" }}>
        <div>
          <VoiceRecorder />{" "}
        </div>
        <div>
          <FlightInfo />
        </div>
      </div>
    </div>
  )
}
