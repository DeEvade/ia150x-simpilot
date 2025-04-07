
import { ActionTypes }  from "./utils"
import {Command, Action} from "../interfaces"
import { callSignToNato } from "./string_processing"
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
            //const phoneticHeading = headingParameter(param);
            const phoneticHeading = "";
            return `${getRandomSentence(clearedHeadingSentence)}${phoneticHeading}, ${callsign}.`;
        },
        [ActionTypes.CANCEL_SPEED]: (param, callsign) => `${getRandomSentence(cancelSpeedSentence)}${param}, ${callsign}.`,
            [ActionTypes.CANCEL_HEADING]: (param, callsign) => `${getRandomSentence(cancelHeadingSentence)}${callsign}.`,
            [ActionTypes.CLEARED_DIRECT]: (param, callsign) => `${getRandomSentence(clearedDirectSentence)}${param}, ${callsign}.`
    };
    console.log(actionMap[action]?.(parameter.toString(), callSign) || null)
    return actionMap[action]?.(parameter.toString(), callSign) || null;
};
buildTTSPhrase({
    callSign: "SAS123",
    action: "cleared flight level",
    parsedAction: "" as unknown as Action,
    parameter: 100
})
