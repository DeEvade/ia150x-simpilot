import { useEffect, useState } from "react"
import { LogBox } from "./LogBox"

export const CommandLogViewer = () => {
    type logType = {
        log: string
        wasSuccesful: boolean
        rawTranscript: string
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
            <h2 style={{ margin: "0" }}>Command Log</h2>
            <div
                onClick={clearLog}
                style={{
                    display: "flex",
                    justifyContent: "center",
                    color: "#ff4d4f",
                    border: "none",
                    width: "50px",
                    height: "10px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: "10px"
                }}
            >
                {/* &times; */}
                Clear log
            </div>
            <ul style={{ overflowY: "auto", maxHeight: "50vh", padding: "0" }}>
                {[...log].reverse().map((entry, idx) => {
                    if (entry == null) return null
                    const x = JSON.parse(entry.log)

                    return <LogBox x={x} entry={entry} key={idx} />
                })}
            </ul>

        </div>
    )
}
