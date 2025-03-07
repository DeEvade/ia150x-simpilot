import * as React from "react"
import { useState, useRef } from "react"
import { parseTranscribedText } from "../apiUtils"
const openai_api_key = ""
export default function VoiceRecorder() {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [rawTranscript, setRawTranscript] = useState<string>("")
  const [processedTranscript, setProcessedTranscript] = useState<string>("")

  const isRecording = useRef(false)

  React.useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
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

  const processAudio = async (data: Blob[]) => {
    console.log("Processing audio...", data.length)

    const blob = new Blob(data, { type: "audio/webm" })

    const formData = new FormData()
    formData.append("file", blob, "audio.webm")
    formData.append("model", "whisper-1")

    try {
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openai_api_key}`,
        },
        body: formData,
      })
      if (!response.ok) {
        console.error("Failed to transcribe audio:", response.statusText)
        return
      }
      const data = await response.json()

      setRawTranscript(data.text || "Transcription failed")
      const parsedText = await parseTranscribedText(data.text)
      if (parsedText) {
        setProcessedTranscript(parsedText.processedTranscript)
        console.log("test123", parsedText.processedTranscript)

        //setProcessedTranscript(parsedText || "Processing failed");
      }
    } catch (error) {
      console.error("Error transcribing audio:", error)
      setRawTranscript("Transcription failed")
    }
  }

  React.useEffect(() => {
    if (audioChunks.length > 0) {
      processAudio(audioChunks)
    }
  }, [audioChunks])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && !isRecording.current) {
        startRecording()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      {audioChunks.length > 0 && (
        <audio controls src={URL.createObjectURL(new Blob(audioChunks, { type: "audio/mp3" }))} />
      )}
      <h1 className="text-2xl font-bold mb-4">Hold Spacebar to Record</h1>
      {isRecording.current ? <div>Recording...</div> : <div>Not recording</div>}
      <div className="p-4 border rounded-lg border-gray-500">
        Raw: {rawTranscript || "Your raw transcription will appear here"}
      </div>
      <div className="p-4 border rounded-lg border-gray-500">
        Processed: {processedTranscript || "Your processed transcription will appear here"}
      </div>
    </div>
  )
}
