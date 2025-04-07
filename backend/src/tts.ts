const voiceModels = ["p225", "p226", "p227"]
const ip = "0.0.0.0"
const port = 1337
let availableModels = Array.from(voiceModels)
import { ActionTypes }  from "./utils"
import {Command, Action} from "../interfaces"
import { callSignToNato } from "./string_processing"
import OpenAI from 'openai';
import dotenv from "dotenv"
import * as fs from 'fs';
import type { IncomingMessage } from 'http'; 

dotenv.config();
const openai = new OpenAI();

const clearedFlightLevelSentence = [
    "Cleared for flight level "
];
const clearedAirspeedSentence = [
    "Adjusting speed to "
];
const clearedMachSentence = [
    "Mach set to "
];
const clearedHeadingSentence = [
    "Turning to heading "
];
const cancelSpeedSentence = [
    "Cancelling speed restriction "
];
const cancelHeadingSentence = [
    "Cancelling heading instruction, resuming own navigation "
];
const clearedDirectSentence = [
    "Proceeding direct to "
];


const instructions = "Speak like a real-life airline pilot with heavy swedish accent who is responding to a command. Fast and nonchalant.";

const getRandomSentence = (array: string[]): string => {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
};
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

export const commandToSpeech = (command : Command) => {
    const input = buildTTSPhrase(command) as string;
    sendTTS(input);
}

export const clarifyCommand = () => {
    sendTTS("Sorry, I didn't catch that, please repeat.")
}

const sendTTS = async (input : string) => {
    //send to server
    const response = await openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice: 'verse',
        input,
        instructions,
        response_format: "wav"
    });
    console.log(response);
    const outputStream = fs.createWriteStream('tts_output.wav');

    // 💡 TypeScript fix: check for null + assert as Node stream
    if (response.body) {
        (response.body as unknown as NodeJS.ReadableStream).pipe(outputStream);
        return response;
    } else {
        throw new Error("No response body received from OpenAI TTS.");
    }
}

const buildTTSPhrase = (command: Command): string | null=> {
    const callSign = callSignToNato(command.callSign);
    const action = command.action as string;
    const parameter = command.parameter;

    const actionMap: Record<string, (param: string, callsign: string) => string> = {
        [ActionTypes.CLEARED_FLIGHT_LEVEL]: (param, callsign) => `${getRandomSentence(clearedFlightLevelSentence)}${param}, ${callsign}.`,
            [ActionTypes.CLEARED_AIRSPEED]: (param, callsign) => `${getRandomSentence(clearedAirspeedSentence)}${param} knots, ${callsign}.`,
            [ActionTypes.CLEARED_MACH]: (param, callsign) => `${getRandomSentence(clearedMachSentence)}${param}, ${callsign}.`,
            [ActionTypes.CLEARED_HEADING]: (param, callsign) => `${getRandomSentence(clearedHeadingSentence)}${param}, ${callsign}.`,
            [ActionTypes.CANCEL_SPEED]: (param, callsign) => `${getRandomSentence(cancelSpeedSentence)}${param}, ${callsign}.`,
            [ActionTypes.CANCEL_HEADING]: (param, callsign) => `${getRandomSentence(cancelHeadingSentence)}${callsign}.`,
            [ActionTypes.CLEARED_DIRECT]: (param, callsign) => `${getRandomSentence(clearedDirectSentence)}${param}, ${callsign}.`
    };
    //console.log(actionMap[action]?.(parameter.toString(), callSign) || null)
    return actionMap[action]?.(parameter.toString(), callSign) || null;
};
commandToSpeech({
    callSign: "SAS123",
    action: "cleared flight level",
    parsedAction: "" as unknown as Action,
    parameter: 100
})
