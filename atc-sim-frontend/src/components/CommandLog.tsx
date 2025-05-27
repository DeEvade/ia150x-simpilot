import { useEffect, useState } from "react"
import { LogBox } from "./LogBox"

export const CommandLogViewer = () => {
  type logType = {
    log: string
    wasSuccesful: boolean
  }
  const [log, setLog] = useState<logType[]>([])

  const loadLog = () => {
    const logs = JSON.parse(localStorage.getItem("commandLogs") || "[]")
    console.log("logs: ", logs)
    setLog(logs)
  }

  useEffect(() => {
    loadLog()

    const handleLogUpdate = () => {
      loadLog()
    }

    window.addEventListener("command-logged", handleLogUpdate)
    return () => window.removeEventListener("command-logged", handleLogUpdate)
  }, [])
  const clearLog = () => {
    localStorage.removeItem("commandLogs")
    setLog([]) // refresh UI
  }
  return (
    <div>
      <h2 style={{ marginTop: "50px" }}>Command Log</h2>
      <div
        onClick={clearLog}
        style={{
          display: "flex",
          justifyContent: "center",
          top: 10,
          left: 10,
          backgroundColor: "#ff4d4f",
          color: "white",
          border: "none",
          width: "25px",
          height: "25px",
          borderRadius: "50%",
          cursor: "pointer",
        }}
      >
        &times;
      </div>
      <ul className="font-mono text-sm whitespace-pre-wrap">
        {log.map((entry, idx) => {
          if (entry == null) return null
          const x = JSON.parse(entry.log)

          return <LogBox x={x} entry={entry} key={idx} />
        })}
      </ul>
    </div>
  )
}
