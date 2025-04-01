import { Request } from "express"
import fs from "fs"
import FlightDataStore from "./FlightDataStore"
import { Callsign, FlightData } from "../interfaces"
import mongoose from "mongoose"
import dotenv from "dotenv"
import tiktoken, { get_encoding } from "@dqbd/tiktoken"
const encoding = get_encoding("cl100k_base")

dotenv.config()
const config = fs.readFileSync("../config.json", "utf-8")
const configJSON = JSON.parse(config)
const maxTokenLength = 224

const commonWords = ["cleared"]

console.log("config is: ", config)

const callSigns: Callsign[] = []

const initMongo = async () => {
  const mongoUri = process.env.MONGO_URI
  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined in the environment variables")
  }
  if (mongoose.connection.readyState >= 1) return ""
  await mongoose.connect(mongoUri, {
    dbName: "main",
  })
  console.log("Connected to MongoDB!")
  const dbo = mongoose.connection.db
  if (!dbo) {
    throw new Error("MongoDB connection is not established")
  }
  const collection = dbo.collection("callsigns").find()
  const callsigns = (await collection.toArray()) as unknown as Callsign[]
  //console.log("callsigns: ", callsigns)
  callsigns.forEach((callsign: Callsign) => {
    callSigns.push(callsign)
  })
}
initMongo()
export const transcribeData = async (formData: FormData) => {
  try {
    formData.append("model", configJSON.asr_model)
    const prompt = generateASRPrompt()
    //formData.append("prompt", prompt)
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to transcribe audio:", errorText)
      return { error: errorText }
    } else {
      const data = await response.json()
      console.log("Transcription result:", data.text)
      return data.text
    }
  } catch (error) {
    return { error: "Error processing audio" }
  }
}
const generateASRPrompt = async (): Promise<string> => {
  const callsigns: string[] = []
  let result = ""
  let flightData = FlightDataStore.getInstance().getAllFlightData()

  flightData.forEach((data: FlightData) => {
    callsigns.push(data.callsign)
    const threeLetters = data.callsign.slice(0, 3)
    const callsign = callSigns.find((callsign: Callsign) => callsign.tlcs === threeLetters)
    if (callsign) {
      const phonetic = callsign.cs + " " + data.callsign.slice(3)
      callsigns.push(phonetic)
    }
  })
  result += callsigns.toString()
  let i = 0
  let lengthInToken = encoding.encode(result).length
  console.log("lengthInToken: ", lengthInToken)

  while (lengthInToken < maxTokenLength) {
    const word = commonWords[i]
    if (word === undefined) {
      break
    }
    const lengthOfWordInToken = encoding.encode(word).length
    if (lengthInToken + lengthOfWordInToken < maxTokenLength) {
      result += ", " + word
      lengthInToken += lengthOfWordInToken
    }
    i++
  }

  console.log(result)
  return result
}
