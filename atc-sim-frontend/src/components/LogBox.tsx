import { useState } from "react"

interface Props {
  entry: {
    log: string
    wasSuccesful: boolean
    rawTranscript: string
  }
  x: {
    callSign: string
    action: string
    parameter: string
  }
}

export const LogBox = (props: Props) => {
  const { entry, x } = props

  const [showTranscript, setShowTranscript] = useState<boolean>(false)
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        marginBottom: "10px",
        gap: "2px",
        borderRadius: "5px",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        border: "1px solid rgba(0, 0, 0, 1)",
        width: "fit-content",
        padding: "10px",
        color: entry.wasSuccesful ? "inherit" : "red",
      }}
    >
      <div
        onClick={() => {
          setShowTranscript((prev) => {
            return !prev
          })
        }}
      >
        X
      </div>
      <div>Callsign: {x.callSign}</div>
      <div>Action: {x.action}</div>
      <div>Parameter: {x.parameter}</div>
      {showTranscript && (
        <>
          <hr
            style={{
              border: "none",
              height: "1px",
              backgroundColor: "#ccc",
              margin: "16px 0",
            }}
          />
          <div>
            <div>Transcript: {entry.rawTranscript || "N/A"}</div>
          </div>
        </>
      )}
    </div>
  )
}
