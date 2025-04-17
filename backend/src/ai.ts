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
# Identity

You are tasked to extract information from an ATC (Air Traffic Controller) commandi. 

# Instructions

You will be given the following:
* A transcribed ATC (Air traffic Controller) command. The command will consist of a callsign, an action and a parameter. 
* A list of possible objects containing callsigns. The object consists of the following entries:
    - written: Consists of one word with 5 or 6 characters. (Example : SAS123)
    - spoken: Consists of the same callsign, but the letters are in the NATO phonetic alphabet, and any numbers are in spoken format. (Example: Sierra alpha sierra one two three)
    - phonetic: Consists of the same callsign, but uses the callsign's ICAO code. (Example: Scandinavian one two three)

Your task is to use the transcription to extract the command's callsign, action and parameter into a JSON format.

- Callsign:
    The callsign must be one of the callsigns in the given list of possible callsigns.
    Since the transcription might not be always be completely accurate, there might not be a perfect match in the list. You should match the transcription with a listed callsign if it is similar.
    If you manage to match to a callsign in the list, you should always choose the "written" version of that callsign object.
    If you do not manage to extract a field, leave that field null.

    You should try to match the callsign to one in the following list.
    CallSignList: [${callsigns.map((x) => JSON.stringify(x))}]

- Action:
    The available actions are as follows:
    ActionList: ["cleared airspeed", "cleared mach", "cleared flight level", "cleared altitude", "cleared heading", "cancel heading", "cancel speed", "cleared direct"] 

    The transcribed command might use different phrasing for the action. If the transcribed action is close enough to one of the actions in the ActionList, choose that one. (Example: "turn right to heading zero zero three". You should choose "cleared heading".)
    If the action cannot be matched with a high enough probability, leave the field as null.

- Parameter:
    The value associated with the action. The type of value differs between actions. 
    The following actions are associated with number values: 
        ["cleared airspeed", "cleared mach", "cleared flight level", "cleared altitude", "cleared heading"]
    The folloing action is associated with a name:
        ["cleared direct"]
    The following actions do not have any value and are always null:
        ["cancel heading", "cancel speed"]

# Examples

Given the following fake CallSignList:
CallSignList: [ {written: "EWG1BG", spoken: "Echo Whiskey Golf One Bravo Golf", phonetic: "EUROWINGS One Bravo Golf" }, {written: "SAS169", spoken: "Sierra alpha sierra One Six Niner", phonetic: "Scandinavian One Six Niner"}, {written: "SAS966", spoken: "Sierra alpha sierra Niner Six Six  ", phonetic: "Scandinavian Niner Six Six"}, {written: "RYA221", spoken: "Romeo yankee alpha two two one", phonetic: "Ryanair two two one"} ]


<user_query>
Echo Whiskey Golf One Bravo Golf Cleared to Flight Level Ninety.
</user_query>

<assistant_response>
{
	callSign: “EWG1BG”,
	action: “cleared flight level”,
	parameter: 90
}
</assistant_response>


<user_query>
Sierra alpha sierra One Six Niner turn right to zero six seven.
</user_query>

<assistant_response>
{
	callSign: “SAS169”,
	action: “cleared heading”,
	parameter: 67
}
</assistant_response>

<user_query>
Ryanair two two one maintain speed not less than mach decimal six eight.
</user_query>

<assistant_response>
{
	callSign: “RYA221”,
	action: “cleared mach”,
	parameter: 0.68
}
</assistant_response>

<user_query>
Ryanair two two one resume normal speed when able.
</user_query>

<assistant_response>
{
	callSign: “RYA221”,
	action: “cancel speed”,
	parameter: null
}
</assistant_response>

<user_query>
Sierra alpha sierra One Six neon torn lift to one niner nine.
</user_query>

<assistant_response>
{
	callSign: “SAS169”,
	action: “cleared heading”,
	parameter: 199
}
</assistant_response>

<user_query>
Pioneer damp, increase speed to five hundred knots.
</user_query>

<assistant_response>
{
	callSign: null,
	action: “cleared speed”,
	parameter: 500
}
</assistant_response>

return a JSON object
`
}
