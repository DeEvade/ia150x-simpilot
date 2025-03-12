import { main, closeConnection } from "./findPhonetic.mjs" // Import both functions
import { callSignToNato } from "../src/string_processing.js"
const minimumAltitude = 1000
const maximumAltitude = 42000
const maximumHeading = 360

const possibleAltitude = [
  "cleared to ",
  "climb to ",
  "climb and maintain ",
  "descend to ",
  "descend and maintain ",
]
//not implemented
const possibleAltitudeAlternativeFirst = ["leave ", "descend from ", "climb from "]
//not implemented
const possibleAltitudeAlternativeSecond = [
  "climb to ",
  "climb and maintain ",
  "descend to ",
  "descend and maintain ",
]
const possibleHeading = [
  "turn right to heading ",
  "turn left to heading ",
  "turn right heading ",
  "turn left heading ",
  "cleared heading ",
  "fly heading ",
]

function altitudeParameter() {
  let altitude = Math.floor(Math.random() * (maximumAltitude - minimumAltitude + 1)) + 1000
  //make it closest 1000 when above 10000 feet, otherwise closest 500.
  if (altitude < 10000) {
    altitude = Math.round(altitude / 500) * 500
  } else {
    altitude = Math.round(altitude / 1000) * 1000
  }
  //if altitude is greater than 24 000 - convert to flight level
  if (altitude >= 24000) return "Flight level " + callSignToNato((altitude / 100).toString())
  else {
    return altitude / 1000 + " thousand" + " feet."
  }
  console.log(altitude)
}

async function headingParameter() {
  try {
    let heading = Math.floor(Math.random() * (1 + maximumHeading)) - 1
    let headingPhonetic = callSignToNato(heading.toString())
    if (heading < 100) {
      if (heading < 10) {
        headingPhonetic = "Zero Zero " + headingPhonetic
      } else {
        headingPhonetic = "Zero " + headingPhonetic
      }
    }
    let i = Math.floor(Math.random() * possibleHeading.length)
    let obj = await main()
    let sentence = obj.phonetic + ", " + possibleHeading[i] + headingPhonetic
    console.log(sentence)
    return sentence
  } catch (error) {
    console.error("error from generateSentence: " + error)
  } finally {
    await closeConnection()
  }
}

async function generateAltitudeSentence() {
  try {
    let sentence
    let i = Math.floor(Math.random() * possibleAltitude.length)
    let obj = await main()
    let chance = Math.floor(Math.random())
    //more often the callsign instead of three letter thingy
    if (chance < 0.7) {
      sentence = obj.phonetic + ", " + possibleAltitude[i] + altitudeParameter()
    } else {
      sentence = obj.spoken + ", " + possibleAltitude[i] + altitudeParameter()
    }
    console.log(sentence)
    return sentence
  } catch (error) {
    console.error("error from generateSentence: " + error)
  } finally {
    await closeConnection()
  }
}
export async function generateSentence() {
  let chance = Math.floor(Math.random())

  if (chance <= 0.5) return await generateAltitudeSentence()
  else {
    return await headingParameter()
  }
}
