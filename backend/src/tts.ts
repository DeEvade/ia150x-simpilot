const voiceModels = ["p225", "p226", "p227"]
const ip = "0.0.0.0"
const port = 1337
let availableModels = Array.from(voiceModels)
import { ActionTypes }  from "./utils"
import {Command, Action, TTSObject} from "../interfaces"
import { callSignToNato } from "./string_processing"
import OpenAI from 'openai';
import dotenv from "dotenv"
import { promises as fs } from 'fs';
import { writeFileSync } from "fs";


import type { IncomingMessage } from 'http'; 
import { Readable } from "stream";

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

const clarifyCommandSentence = [
    "Sorry, I didn't catch that, please repeat."
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

export const commandToSpeech = async (command : Command): Promise<TTSObject> => {
    const input = buildTTSPhrase(command) as string;
    if(!input)
        clarifyCommand();
    const audio  = await sendTTS(input) ;
    const obj :  TTSObject = {audio : audio.toString('base64'), pilotSentence : input};
    return obj;
}

export const clarifyCommand = async (): Promise<TTSObject> => {
    const input = getRandomSentence(clarifyCommandSentence);
    const audio = await sendTTS(input);
    const obj :  TTSObject = {audio : audio.toString('base64'), pilotSentence : input};
    return obj;
};

const sendTTS = async (input: string): Promise<Buffer> => {
    // Send to server
    const response = await openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice: 'verse',
        input,
        instructions,
        response_format: "wav"
    });

    const { body } = response;

    // Handle the stream as a Node.js Readable stream (e.g., PassThrough stream)
    if (body && body instanceof Readable) {
        const buffer = await streamToBuffer(body); // Convert the stream to a buffer
        return buffer;
    }

    throw new Error("Unexpected response body type");
};


const streamToBuffer = (stream: Readable): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        
        stream.on('data', chunk => {
            chunks.push(chunk);  // Collect chunks of data
        });
        
        stream.on('end', () => {
            resolve(Buffer.concat(chunks));  // Concatenate chunks and resolve as a buffer
        });
        
        stream.on('error', reject);  // Reject if an error occurs
    });
};

const buildTTSPhrase = (command: Command): string | null=> {
    if(!command.callSign)
        return null;
    const callSign = callSignToNato(command.callSign);
    const action = command.action as string;
    const parameter = command.parameter;

    const actionMap: Record<string, (param: string, callsign: string) => string> = {
        [ActionTypes.CLEARED_FLIGHT_LEVEL]: (param, callsign) => `${getRandomSentence(clearedFlightLevelSentence)}${param}, ${callsign}.`,
            [ActionTypes.CLEARED_AIRSPEED]: (param, callsign) => `${getRandomSentence(clearedAirspeedSentence)}${param} knots, ${callsign}.`,
            [ActionTypes.CLEARED_MACH]: (param, callsign) => `${getRandomSentence(clearedMachSentence)}${param}, ${callsign}.`,
            [ActionTypes.CLEARED_HEADING]: (param, callsign) => {
            const phoneticHeading = headingParameter(param);
            return `${getRandomSentence(clearedHeadingSentence)}${phoneticHeading}, ${callsign}.`;
        },
        [ActionTypes.CANCEL_SPEED]: (_, callsign) => `${getRandomSentence(cancelSpeedSentence)}, ${callsign}.`,
            [ActionTypes.CANCEL_HEADING]: (_, callsign) => `${getRandomSentence(cancelHeadingSentence)}${callsign}.`,
            [ActionTypes.CLEARED_DIRECT]: (param, callsign) => `${getRandomSentence(clearedDirectSentence)}${param}, ${callsign}.`
    };

    const noParamActions: Set<string> = new Set([
        ActionTypes.CANCEL_HEADING,
        ActionTypes.CANCEL_SPEED
    ]);

    if (actionMap[action] == null) {
        return null;
    }

    if (parameter == null && noParamActions.has(action)) {
        return actionMap[action]!(null as any, callSign);
    }

    return actionMap[action]!(parameter.toString(), callSign);
};


const headingParameter = (headingString : string):string =>{
    const heading = +headingString;
    if (heading < 100) {
        if (heading < 10) {
            return "Zero Zero " + heading.toString();
        } else {
            return "Zero " + heading.toString();
        }
    }
    return heading.toString();
}
