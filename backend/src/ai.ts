import OpenAI from "openai"
import FlightDataStore from "./FlightDataStore"
import { FlightData } from "../interfaces"
import { callSignToNato } from "./string_processing"
import { configDotenv } from "dotenv"
configDotenv()
const apiKey = process.env.OPENAI_KEY;
const openai = new OpenAI()

export const processTranscription = async (transcript: string, overrideCallsigns?: string[]) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,

      messages: [
        { role: "system", content: getTranscribeSystemPrompt(overrideCallsigns) },
        {
          role: "user",
          content: transcript,
        },
      ],
      store: true,
    })

    const result = completion.choices[0].message.content
    console.log(result)
    return result
  } catch (error: unknown) {
    console.error("Error processing transcription:", error)
    return null
  }
}

const getTranscribeSystemPrompt = (overrideCallsigns?: string[]) => {
  let flightData = FlightDataStore.getInstance().getAllFlightData()
  let callsigns: string[] = []
  flightData.forEach((data: FlightData) => {
    callsigns.push(data.callsign)
    callsigns.push(callSignToNato(data.callsign))
  })
  if (overrideCallsigns) {
    callsigns = overrideCallsigns
  }
  console.log("callsigns", callsigns)

  return `
You will be given a transcribed ATC (Air traffic Controller) command. The command will consist of a call sign, action and a parameter. Your task is to extract this information into JSON format.

You should try to match the callsign to one in the following list.
CallSignList: ${callsigns.toString()}

The received callsign may differ slightly from the callsigns in the CallSignList. 
If no callsign in the CallSignList is close to the received callsign, leave the field as null.

You should try to match the action to one in the following list.
ActionList: ["cleared airspeed", "cleared mach", "cleared flight level", "cleared altitude", "cleared heading", "cancel heading", "cancel speed", "cleared direct"] 

Example Input: Echo Whiskey Golf One Bravo Golf Cleared to Flight Level Ninety.

Example Output:
{
	callSign: “EWG1BG”,
	action: “cleared flight level”,
	parameter: 90
}

return a JSON object
`
}
