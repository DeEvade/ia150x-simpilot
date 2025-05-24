import { FlightData } from "./components/FlightInfo"

const backendPort = 8080
const uri = `${window.location.protocol}//${window.location.hostname}:${backendPort}`
console.log("uri is ", uri)

export const transcribeText = async (audioChunks: Blob[]) => {
  console.log("Processing audio...", audioChunks.length)
  const blob = new Blob(audioChunks, { type: "audio/webm" })
  const formData = new FormData()
  formData.append("file", blob, "audio.webm")
  formData.append("model", "whisper-1")
  try {
    const response = await fetch(`${uri}/processAudio`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) {
      console.error("Failed to transcribe audio:", response.statusText)
      return null
    }
    const data = await response.json()
    return data
  } catch (error: unknown) {
    console.error("Error transcribing audio:", error)
    return null
  }
}

export const parseTranscribedText = async (transcript: string) => {
  try {
    const response = await fetch(`${uri}/processTranscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript }),
    })
    if (!response.ok) {
      console.error("Failed to parse transcribed text:", response.statusText)
      return null
    }

    const result = await response.json()
    console.log(result)
    return result
  } catch (error: unknown) {
    console.error("Error parsing transcribed text:", error)
    return new Response(null)
  }
}

export const getFlightData = async () => {
  try {
    const response = await fetch(`${uri}/flightData`)
    if (!response.ok) {
      console.error("Failed to fetch flight data:", response.statusText)
      return null
    }
    const data = await response.json()
    console.log("Flight data:", data)
    if (!data) {
      console.error("No flight data available")
      return null
    }
    return data as FlightData[]
  } catch (error: unknown) {
    console.error("Error fetching flight data:", error)
    return null
  }
}
