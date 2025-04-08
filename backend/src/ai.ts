import OpenAI from "openai"
import FlightDataStore from "./FlightDataStore"
import { CallsignObject, FlightData } from "../interfaces"
import { callSignToNato } from "./string_processing"
import { configDotenv } from "dotenv"
configDotenv()
const apiKey = process.env.OPENAI_KEY
const openai = new OpenAI()

export const processTranscription = async (
  transcript: string,
  overrideCallsigns?: CallsignObject[],
) => {
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

const getTranscribeSystemPrompt = (overrideCallsigns?: CallsignObject[]) => {
  let flightData = FlightDataStore.getInstance().getAllFlightData()
  let callsigns: Object[] = []
  //lägg in icao också
  flightData.forEach((data: FlightData) => {
    callsigns.push({
      idCallsign: data.callsign,
      phoneticCallsign: callSignToNato(data.callsign),
      icaoCallsign: "",
    })
  })
  if (overrideCallsigns) {
    callsigns = overrideCallsigns
  }
  console.log("callsigns", callsigns)

  //Kanske borde para ihop alla callsignsigns, t ex [{SAS123, Sierra alpha sierra one two three, Scandinavian 123}, {UAL321, Uniform alpha lima three two one, United 321}]
  //och sedan säga att om den hör en av de så ta den som är längst till vänster
  return `
You will be given a transcribed ATC (Air traffic Controller) command. The command will consist of a call sign, action and a parameter. Your task is to extract this information into JSON format.

You should try to match the callsign to one in the following list.
CallSignList: [${callsigns.map((x) => JSON.stringify(x))}]

The received callsign may differ slightly from the callsigns in the CallSignList. 
If no callsign in the CallSignList is close to the received callsign, leave the field as null.
If you match with any of the objects in the CallSignList, always choose the "written".
The callsign should always consist of 5 or 6 characters and always exactly one word.

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
