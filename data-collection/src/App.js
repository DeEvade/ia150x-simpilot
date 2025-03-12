import "./App.css"
import React, { useEffect, useState, useRef } from "react"

function App() {
  const [scenario, setScenario] = useState(null)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const isRecording = useRef(false)
  const [user, setUser] = useState("")

  const getScenario = async () => {
    setScenario(null)
    const response = await fetch("http://localhost:8080/generateScenario")
    const data = await response.json()
    setScenario(data)
  }

  const processAudio = async () => {
    const mergedBlob = new Blob(audioChunks, { type: "audio/webm" })
    const audioString = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result.split(",")[1])
      reader.onerror = reject
      reader.readAsDataURL(mergedBlob)
    })
    console.log("Audio processed", audioString)

    await fetch("http://localhost:8080/postScenario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...scenario,
        audio: audioString,
        user,
      }),
    })

    setAudioChunks([])
    getScenario()
  }

  React.useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
        audioBitsPerSecond: 16000,
      })
      recorder.ondataavailable = (event) => {
        setAudioChunks((prev) => [...prev, event.data])
      }
      setMediaRecorder(recorder)
    })
  }, [])

  const startRecording = () => {
    if (mediaRecorder && !isRecording.current) {
      setAudioChunks([])
      mediaRecorder.start()
      isRecording.current = true
    }
  }

  const stopRecording = async () => {
    if (mediaRecorder && isRecording.current) {
      mediaRecorder.stop()
      isRecording.current = false
    }
  }
  React.useEffect(() => {
    if (audioChunks.length > 0) {
      //processAudio(audioChunks)
    }
  }, [audioChunks])

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space" && !isRecording.current) {
        startRecording()
      }
    }

    const handleKeyUp = (event) => {
      if (event.code === "Space" && isRecording.current) {
        stopRecording()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  })
  useEffect(() => {
    getScenario()
  }, [])
  return (
    <div className="App">
      <header className="App-header">
        <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="Username..." />
        <h1>Scenario Generator</h1>
        {scenario === null ? <p>Loading...</p> : <p>{scenario.sentence}</p>}

        {audioChunks.length > 0 && (
          <>
            <audio
              controls
              src={URL.createObjectURL(new Blob(audioChunks, { type: "audio/mp3" }))}
            />
            <button onClick={processAudio}>Submit to db</button>
          </>
        )}
      </header>
    </div>
  )
}

export default App
