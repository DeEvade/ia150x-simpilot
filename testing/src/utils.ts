import { CallsignObject } from "./interfaces"

const backend = "http://localhost:8080"

export const transcribeText = async (base64Audio: string) => {
  console.log("Processing base64 audio...")

  // Convert base64 to a Blob
  const byteCharacters = atob(base64Audio) // Decode base64
  const byteNumbers = new Uint8Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const audioBlob = new Blob([byteNumbers], { type: "audio/webm" })

  // Prepare FormData
  const formData = new FormData()
  formData.append("file", audioBlob, "audio.webm")
  formData.append("model", "whisper-1")

  try {
    const response = await fetch(`${backend}/processAudio`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      console.log("response: ", response)
      console.error("Failed to transcribe audio:", response.statusText)
      return null
    }

    const data = await response.json()
    return data.text
  } catch (error: unknown) {
    console.error("Error transcribing audio:", error)
    return null
  }
}

export const parseTranscribedText = async (
  transcript: string,
  callsignsArray: CallsignObject[],
) => {
  try {
    const response = await fetch(`${backend}/processTranscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript, overrideCallsigns: callsignsArray }),
    })
    if (!response.ok) {
      console.error("Failed to parse transcribed text:", response.statusText)
      return null
    }
    const result = await response.json()
    //console.log(result)
    return result
  } catch (error: unknown) {
    console.error("Error parsing transcribed text:", error)
    return null
  }
}
