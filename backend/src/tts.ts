const voiceModelsSWE: string[] = [
    "sv-SE-MattiasNeural",
    "sv-SE-HilleviNeural",
]
const voiceModelsNOR: string[] = [
    "nb-NO-PernilleNeural",
    "nb-NO-FinnNeural",
]
const voiceModelsIRE: string[] = [
    "en-IE-EmilyNeural",
    "en-IE-ConnorNeural",
]
const voiceModelsGEN: string[] = [
    "en-GB-SoniaNeural",
    "en-GB-RyanNeural",
    "en-GB-LibbyNeural",
    "en-GB-AbbiNeural",
    "en-GB-AlfieNeural",
    "en-GB-BellaNeural",
    "en-GB-ElliotNeural",
    "en-GB-EthanNeural",
    "en-GB-HollieNeural",
    "en-GB-MaisieNeural",
    "en-GB-NoahNeural",
    "en-GB-OliverNeural",
    "en-GB-OliviaNeural",
    "en-GB-ThomasNeural",
    "en-HK-YanNeural",
    "en-HK-SamNeural",
    "en-IN-AaravNeural",
    "en-IN-AashiNeural",
    "en-IN-AartiNeural",
    "en-IN-ArjunNeural",
    "en-IN-AnanyaNeural",
    "en-IN-KavyaNeural",
    "en-IN-KunalNeural",
    "en-IN-NeerjaNeural",
    "en-IN-PrabhatNeural",
    "en-IN-AartiIndicNeural",
    "en-IN-ArjunIndicNeural",
    "en-IN-NeerjaIndicNeural",
    "en-IN-PrabhatIndicNeural",
    "en-KE-AsiliaNeural",
    "en-KE-ChilembaNeural",
    "en-NG-EzinneNeural",
    "en-NG-AbeoNeural",
    "en-NZ-MollyNeural",
    "en-NZ-MitchellNeural",
    "en-PH-RosaNeural",
    "en-PH-JamesNeural",
    "en-SG-LunaNeural",
    "en-SG-WayneNeural",
    "en-TZ-ImaniNeural",
    "en-TZ-ElimuNeural",
    "en-US-AvaNeural",
    "en-US-AndrewNeural",
    "en-US-EmmaNeural",
    "en-US-BrianNeural",
    "en-US-JennyNeural",
    "en-US-GuyNeural",
    "en-US-AriaNeural",
    "en-US-DavisNeural",
    "en-US-JaneNeural",
    "en-US-JasonNeural",
    "en-US-KaiNeural",
    "en-US-LunaNeural",
    "en-US-SaraNeural",
    "en-US-TonyNeural",
    "en-US-NancyNeural",
    "en-US-AmberNeural",
    "en-US-AnaNeural",
    "en-US-AshleyNeural",
    "en-US-BrandonNeural",
    "en-US-ChristopherNeural",
    "en-US-CoraNeural",
    "en-US-ElizabethNeural",
    "en-US-EricNeural",
    "en-US-JacobNeural",
    "en-US-MichelleNeural",
    "en-US-MonicaNeural",
    "en-US-RogerNeural",
    "en-US-SteffanNeural",
    "en-ZA-LeahNeural",
]
import { ActionTypes, findSingleICAO } from "./utils"
import { Command, Action, TTSObject } from "../interfaces"
import { callSignToNato } from "./string_processing"
import OpenAI from "openai"
import dotenv from "dotenv"
import { Readable } from "stream"

dotenv.config()

const clearedFlightLevelSentence = ["Cleared for flight level "]
const clearedAirspeedSentence = ["Adjusting speed to "]
const clearedMachSentence = ["Mach set to "]
const clearedHeadingSentence = ["Turning to heading "]
const cancelSpeedSentence = ["Cancelling speed restriction "]
const cancelHeadingSentence = ["Cancelling heading instruction, resuming own navigation "]
const clearedDirectSentence = ["Proceeding direct to "]

const clarifyCommandSentence = ["Sorry, I didn't catch that, please repeat."]
let callSignVoiceModelMap: Map<string, string> = new Map<string, string>();;

const getRandomSentence = (array: string[]): string => {
    const randomIndex = Math.floor(Math.random() * array.length)
    return array[randomIndex]
}

/*
    const textToSpeech = async(command : string, plane : id) => {
    try{
        let voiceModel = id.voice; 
        doTTSthingy(command, voiceModel)
    }
    catch(error){
dotenv.config()

    }
}

const newPlaneArrivedInsideOfTheComputerizedSimulator = (plane : id) => {
    const length = availableModels.length
    if(length < 1 ){
        idk
    }
    const i = Math.floor(Math.random() * length);
    const voiceModel = availableModels[i];
    availableModels.splice(i,1); //ta bort modellen från listan
    id.voice = voiceModel;
}

const planeDisappearedFromTheInsideOfTheComputerizedSimulator = (plane : id) => {
    availableModels.push(id.voice)
    id = null;
}
*/

export const commandToSpeech = async (command: Command, skipTTS?: boolean): Promise<TTSObject> => {
    if (skipTTS) {
        return { audio: null, pilotSentence: "testing testing" } as unknown as TTSObject
    }
    const input = await buildTTSPhrase(command)
    if (!input) {
        return clarifyCommand()
    }
    const audio = await sendTTS(input, command.callSign)
    const obj: TTSObject = { audio: audio.toString("base64"), pilotSentence: input }
    return obj
}

export const clarifyCommand = async (skipTTS?: boolean): Promise<TTSObject> => {
    if (skipTTS) {
        return { audio: null, pilotSentence: "testing testing" } as unknown as TTSObject
    }
    const input = getRandomSentence(clarifyCommandSentence)
    const audio = await sendTTS(input, "ERR")
    const obj: TTSObject = { audio: audio.toString("base64"), pilotSentence: input }
    return obj
}

import axios from "axios"
import FlightDataStore from "./FlightDataStore"


const AZURE_TTS_KEY = process.env.AZURE_TTS_KEY!
const AZURE_TTS_REGION = process.env.AZURE_TTS_REGION!


const chooseVoice = (callSign: string) => {
    const threeLetters = callSign.slice(0,3);
    switch (threeLetters) {
        case "SAS": {
            callSignVoiceModelMap.set(callSign, voiceModelsSWE[Math.floor(Math.random() * voiceModelsSWE.length)])
            return;
        }
        case "NSZ": {
            callSignVoiceModelMap.set(callSign, voiceModelsNOR[Math.floor(Math.random() * voiceModelsNOR.length)])
            return;
        }
        case "NOZ": {
            callSignVoiceModelMap.set(callSign, voiceModelsNOR[Math.floor(Math.random() * voiceModelsNOR.length)])
            return;
        }
        case "RYR": {
            callSignVoiceModelMap.set(callSign, voiceModelsIRE[Math.floor(Math.random() * voiceModelsIRE.length)])
            return;
        }
        default: {
            callSignVoiceModelMap.set(callSign, voiceModelsGEN[Math.floor(Math.random() * voiceModelsGEN.length)])
            return;
        }
    }
}
// const voiceStyle = "chat"

const sendTTS = async (input: string,  callSign: string): Promise<Buffer> => {
    console.time("Azure TTS Request")
    let voiceName = "";
    if(!callSignVoiceModelMap.get(callSign))
        chooseVoice(callSign)
    voiceName = callSignVoiceModelMap.get(callSign) as string

    const endpoint = `https://${AZURE_TTS_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`

    const headers = {
        "Ocp-Apim-Subscription-Key": AZURE_TTS_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "riff-16khz-16bit-mono-pcm",
        "User-Agent": "pilot-simulator",
    }

    const ssml = `
    <speak version="1.0" xml:lang="en-US">
      <voice name="${voiceName}">
        <prosody rate="0%" pitch="0%">
          ${input}
        </prosody>
      </voice>
    </speak>`

    const response = await axios.post(endpoint, ssml, {
        headers,
        responseType: "arraybuffer",
    })

    console.timeEnd("Azure TTS Request")
    return Buffer.from(response.data)
}

const streamToBuffer = (stream: Readable): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []

        stream.on("data", (chunk) => {
            chunks.push(chunk) // Collect chunks of data
        })

        stream.on("end", () => {
            resolve(Buffer.concat(chunks)) // Concatenate chunks and resolve as a buffer
        })

        stream.on("error", reject) // Reject if an error occurs
    })
}

const buildTTSPhrase = async (command: Command): Promise<string | null> => {
    if (!command.callSign) return null
    const callSignNumbers = command.callSign.slice(3)
    let callSign = callSignToNato(command.callSign)
    const callSignICAO = await findSingleICAO(command.callSign)
    console.log("callSignICAO: ", callSignICAO)
    if (callSignICAO) {
        const parts = callSignICAO.trim().split(" ");
        parts.pop(); // remove the last word
        callSign = parts.join(" ") + " " + callSignToNato(callSignNumbers);
    }

    const action = command.action as string
    const parameter = command.parameter

    const actionMap: Record<string, (param: string, callsign: string) => string> = {
        [ActionTypes.CLEARED_FLIGHT_LEVEL]: (param, callsign) =>
            `${getRandomSentence(clearedFlightLevelSentence)}${callSignToNato(param)}, ${callsign}.`,
        [ActionTypes.CLEARED_AIRSPEED]: (param, callsign) =>
            `${getRandomSentence(clearedAirspeedSentence)}${callSignToNato(param)} knots, ${callsign}.`,
        [ActionTypes.CLEARED_MACH]: (param, callsign) =>
            `${getRandomSentence(clearedMachSentence)}${callSignToNato(param)}, ${callsign}.`,
        [ActionTypes.CLEARED_HEADING]: (param, callsign) => {
            const phoneticHeading = headingParameter(param)
            return `${getRandomSentence(clearedHeadingSentence)}${phoneticHeading}, ${callsign}.`
        },
        [ActionTypes.CANCEL_SPEED]: (_, callsign) =>
            `${getRandomSentence(cancelSpeedSentence)}, ${callsign}.`,
        [ActionTypes.CANCEL_HEADING]: (_, callsign) =>
            `${getRandomSentence(cancelHeadingSentence)}${callsign}.`,
        [ActionTypes.CLEARED_DIRECT]: (param, callsign) =>
            `${getRandomSentence(clearedDirectSentence)}${param}, ${callsign}.`,
    }

    const noParamActions: Set<string> = new Set([
        ActionTypes.CANCEL_HEADING,
        ActionTypes.CANCEL_SPEED,
    ])

    if (actionMap[action] == null) {
        return null
    }

    if (parameter == null && noParamActions.has(action)) {
        return actionMap[action]!(null as any, callSign)
    }

    return actionMap[action]!(parameter.toString(), callSign)
}

const headingParameter = (headingString: string): string => {
    const heading = +headingString
    if (heading < 100) {
        if (heading < 10) {
            return "Zero Zero " + callSignToNato(heading.toString())
        } else {
            return "Zero " + callSignToNato(heading.toString())
        }
    }
    return callSignToNato(heading.toString())
}
