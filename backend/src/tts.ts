const voiceModels = ["p225", "p226", "p227"]
const ip = "0.0.0.0"
const port = 1337
let availableModels = Array.from(voiceModels)
import { ActionTypes }  from "./utils"
import { Command, Action } from "../interfaces"

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
  "Cancel speed restriction, maintaining "
];
const cancelHeadingSentence = [
  "Cancel heading instruction, resuming own navigation "
];
const clearedDirectSentence = [
  "Proceeding direct to "
];

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

export const clarifyCommand = () => {
  //tts engine..$
  //skicka "please repeat command"
}

export const sendTTS = (command : Command) => {
    buildTTSPhrase(command);
    //send to server
    
}

const buildTTSPhrase = (command: Command) => {
    const callSign = command.callSign;
    const action = command.action as string;
    const parameter = command.parameter;

  const actionMap: Record<string, (param: string, callsign: string) => string> = {
    [ActionTypes.CLEARED_FLIGHT_LEVEL]: (param, callsign) => `${getRandomSentence(clearedFlightLevelSentence)}${param}, ${callsign}.`,
    [ActionTypes.CLEARED_AIRSPEED]: (param, callsign) => `${getRandomSentence(clearedAirspeedSentence)}${param}, ${callsign}.`,
    [ActionTypes.CLEARED_MACH]: (param, callsign) => `${getRandomSentence(clearedMachSentence)}${param}, ${callsign}.`,
    [ActionTypes.CLEARED_HEADING]: (param, callsign) => `${getRandomSentence(clearedHeadingSentence)}${param}, ${callsign}.`,
    [ActionTypes.CANCEL_SPEED]: (param, callsign) => `${getRandomSentence(cancelSpeedSentence)}${param}, ${callsign}.`,
    [ActionTypes.CANCEL_HEADING]: (param, callsign) => `${getRandomSentence(cancelHeadingSentence)}${callsign}.`,
    [ActionTypes.CLEARED_DIRECT]: (param, callsign) => `${getRandomSentence(clearedDirectSentence)}${param}, ${callsign}.`
  };
   //console.log(actionMap[action]?.(parameter.toString(), callSign) || null)
    return actionMap[action]?.(parameter.toString(), callSign) || null;
};
/*
buildTTSPhrase({
  callSign: "SAS123",
  action: "cleared flight level",
  parsedAction: "" as unknown as Action,
  parameter: 100
})
*/
