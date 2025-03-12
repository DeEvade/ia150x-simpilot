import "./App.css"
import React, { useEffect, useState, useRef } from "react"
const getScenario = async () => {
  const response = await fetch("http://localhost:8080/generateScenario")
  const data = await response.json()
  return data.scenario
}

function App() {
  const [scenario, setScenario] = useState("")
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const isRecording = useRef(false)

  const processAudio = async () => {
    const mergedBlob = new Blob(audioChunks, { type: "audio/webm" })
    const audioString = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result.split(",")[1])
      reader.onerror = reject
      reader.readAsDataURL(mergedBlob)
    })
    console.log("Audio processed", audioString)

    //setAudioChunks([])
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
    getScenario().then((data) => setScenario(data))
  }, [])
  return (
    <div className="App">
      <header className="App-header">
        <h1>Scenario Generator</h1>
        <p>{scenario}</p>
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
