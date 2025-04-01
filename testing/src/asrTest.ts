import { MongoClient, ServerApiVersion } from "mongodb"
import { numberToString2 } from "./string_processing"
const uri = "mongodb://vm.cloud.cbh.kth.se:20136/"
const whisperURI = "http://localhost:8080"
const testSize = 100 //  change according to size of testing collection

const client = new MongoClient(uri)

const run = async () => {
  let totalWrongCounter = 0
  let totalLength = 0
  await client.connect()
  console.log("Connected to MongoDB!")
  const dbo = client.db("main")
  const collection = dbo.collection("speech_samples_testing")

  for (let i = 0; i < testSize; i++) {
    let testCase = await collection.find().skip(i).limit(1).next()
    if (!testCase) {
      throw new Error("testcase null")
    }
    let realSentence = JSON.stringify(testCase.sentence)
    realSentence = realSentence.replace(/"/g, "")

    let transcribedSentence = await transcribeText(testCase.audio)
    transcribedSentence = processTranscription(transcribedSentence)
    console.log("-------------------------------------------------------")
    console.log("-------------------------------------------------------")
    // console.log("Real spoken sentence: ")
    // console.log(realSentence) // Logs the retrieved document
    // console.log("Transcription of spoken sentence: ")
    // console.log(transcribedSentence)
    const { length, wer, wrongCounter } = wordErrorRate(realSentence, transcribedSentence)
    totalWrongCounter += wrongCounter
    totalLength += length

    const totalWer = (totalWrongCounter / totalLength) * 100
    console.log("-------------------------------------------------------")
    console.log("word error rate of sentence: ", wer)
    console.log("-------------------------------------------------------")
    console.log("total WER: ", totalWer + " %")
    console.log("-------------------------------------------------------")
  }
  await client.close()
}

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
    const response = await fetch(`${whisperURI}/processAudio`, {
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

function processTranscription(transcribedSentence: string): string {
  //replace all , . - with nothing
  transcribedSentence = transcribedSentence.replace(/[.,-]/g, "")
  let processed = numberToString2(transcribedSentence)
  console.log("processed is: ", processed)

  return processed
}

function wordErrorRate(
  real: string,
  trans: string,
): { wer: number; wrongCounter: number; length: number } {
  let realArray = real
    .toLowerCase()
    .replace(/[.,-]/g, "")
    .split(" ")
    .filter((word) => word !== "" && word != " ")
  let transArray = trans
    .toLowerCase()
    .split(" ")
    .filter((word) => word !== "" && word != " ")

  //console.log("realArray: ", realArray)
  //console.log("transArray: ", transArray)

  let length = realArray.length > transArray.length ? realArray.length : transArray.length

  let wrongCounter = 0
  for (let i = 0; i < length; i++) {
    if (realArray[i] == undefined || transArray[i] == undefined) {
      wrongCounter++
      continue
    }
    if (realArray[i] != transArray[i]) wrongCounter++
  }
  return {
    wer: wrongCounter / length,
    wrongCounter: wrongCounter,
    length: length,
  }
}

run()
