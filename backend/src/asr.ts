import { Request } from "express"
import fs from "fs"
import FlightDataStore from "./FlightDataStore"
import { Callsign, CallsignObject, FlightData } from "../interfaces"
import mongoose from "mongoose"
import dotenv from "dotenv"
import tiktoken, { get_encoding } from "@dqbd/tiktoken"
import { callSignToNato } from "./string_processing"
import { ActionTypes } from "./utils"
const encoding = get_encoding("cl100k_base")
const trainingWaypointList = [
    "GATKI",
    "JEROM",
    "KONKA",
    "SKEAR",
    "VIRGA",
    "PELUP",
    "ARN",
    "BROMO",
    "GÖTEBORG",
] //Konstant nu. Bör parsas från NARSIM

let waypointList: string[]

dotenv.config()
const configFile = fs.readFileSync("../config.json", "utf-8")
const config = JSON.parse(configFile)
const maxTokenLength = 224

const commonWords = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "niner",
    "heading",
    "cleared",
    "mach",
    "decimal",
    "flight",
    "level",
    "climb",
    "maintain",
    "descend",
]

console.log("config is: ", configFile)
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
export const transcribeData = async (formData: FormData, overrideCallsigns: CallsignObject[]) => {
    try {
        formData.append("model", config.asr_model)
        const prompt = (await generateASRPrompt(overrideCallsigns)).toString()
        formData.append("prompt", prompt)
        /*
        for (const [key, value] of Object.entries(config.asr_parameters)) {
          const x = value as any
          formData.append(key, x.toString())
        }*/
        formData.append("language", "en")
        formData.append("temperature", "0")
        const oldUrl = "https://api.openai.com/v1/audio/transcriptions"
        const response = await fetch(oldUrl, {
            // const response = await fetch("http://localhost:8000/v1/audio/transcriptions", {
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
            // console.log("probability log data:" data.logprobs)
            return data.text
        }
    } catch (error) {
        return { error: "Error processing audio" }
    }
}
const generateASRPrompt = async (overrideCallsigns?: CallsignObject[]): Promise<string> => {
    let result = ""
    let flightData = FlightDataStore.getInstance().getAllFlightData()

    let callsigns: CallsignObject[] = []
    waypointList = []
    //lägg in icao också
    flightData.forEach((data: FlightData) => {
        console.log("callsign", data.callsign)

        callsigns.push({
            written: data.callsign,
            phonetic: data.callsignICAO,
            spoken: callSignToNato(data.callsign),
        })
        //TODO Implement ICAOCallsing
    })

    //TESTING
    if (overrideCallsigns && overrideCallsigns.length > 0) {
        callsigns = overrideCallsigns
        waypointList = trainingWaypointList
    }

    const actionList: string[] = []
    Object.values(ActionTypes).forEach((actionType) => {
        actionList.push(actionType)
    })

    //console.log("WaypointList sent to NLU: " + waypointList.toString())
    const callsignStrings = callsigns.map((callsign) => {
        const parts = callsign.phonetic.trim().split(" ");
        parts.pop(); // remove last word
        return parts.join(" ");
    });

    // Remove duplicates
    const uniqueCallsigns = Array.from(new Set(callsignStrings));

    // Join them into one string
    result = ", " + uniqueCallsigns.join(", ");

    result += ", " + actionList.join(", ")
    let i = 0
    let lengthInToken = encoding.encode(result).length
    //lägger först till waypoints
    while (lengthInToken < maxTokenLength) {
        const word = waypointList[i]
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
    //lägger till vanliga ord
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
    console.log("lengthInToken: ", lengthInToken)
    console.log("ASR PROMPT result: ", result)
    //console.log(result)
    return result
}
