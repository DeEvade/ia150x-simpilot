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
        {log.map((entry, idx) => (
          <li key={idx}>{entry}</li>
        ))}
      </ul>
    </div>
  )
}

