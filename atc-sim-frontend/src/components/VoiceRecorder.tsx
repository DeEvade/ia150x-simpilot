import * as React from "react"
import { useState, useRef } from "react"
import { parseTranscribedText, transcribeText } from "../apiUtils"
export default function VoiceRecorder() {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [rawTranscript, setRawTranscript] = useState<string>("")
  const [processedTranscript, setProcessedTranscript] = useState<string>("")
  const [pilotTranscript, setPilotTranscript] = useState<string>("")

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
      const transcirbedText = await transcribeText(data)
      if (!transcirbedText) {
        setRawTranscript("failed transcribe")

        return
      }

      setRawTranscript(transcirbedText.text)
      const parsedText = await parseTranscribedText(transcirbedText.text)
      if (parsedText) {
        setProcessedTranscript(parsedText.processedTranscript)
        console.log("test123", parsedText.processedTranscript)
        console.log("test321", parsedText)

        //setProcessedTranscript(parsedText || "Processing failed");

      }
      if (parsedText.audio) {
          console.log("parsedText: " , parsedText) 
          console.log("pilotSentence: " + parsedText.pilotSentence) 
          setPilotTranscript(parsedText.pilotSentence)
          console.log("we got audio, baby!")
          const audioBlob = new Blob([Uint8Array.from(atob(parsedText.audio), c => c.charCodeAt(0))], {
              type: data.mimeType
          });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();
      }
      else{
          console.log("we aint got audio")
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
      <div className="p-4 border rounded-lg border-gray-500">
        Spoken: {pilotTranscript || "Your pilot transcription will appear here"}
      </div>
    </div>
  )
}
