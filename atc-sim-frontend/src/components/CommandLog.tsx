import { useEffect, useState } from "react"

export const CommandLogViewer = () => {
  const [log, setLog] = useState<string[]>([])

  const loadLog = () => {
    const logs = JSON.parse(localStorage.getItem("commandLogs") || "[]")
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

  return (
    <div>
      <h2>Command Log</h2>
      <ul className="font-mono text-sm whitespace-pre-wrap">
        {log.map((entry, idx) => {
          const x = JSON.parse(entry)

          return (
            <div
              key={idx}
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
              }}
            >
              <div>Callsign: {x.callSign}</div>
              <div>Action: {x.action}</div>
              <div>Parameter: {x.parameter}</div>
            </div>
          )
        })}
      </ul>
    </div>
  )
}
