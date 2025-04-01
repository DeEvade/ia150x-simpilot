import { main, closeConnection } from "./findPhonetic.mjs" // Import both functions
import { callSignToNato, numberToString } from "../src/string_processing.js"
const minimumAltitude = 24000
const maximumAltitude = 42000
const maximumHeading = 360
const minimumSpeed = 180
const maximumSpeed = 350

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
const possibleSpeed = [
  "maintain ",
  "reduce speed to ",
  "reduce to ",
  "increase speed to ",
  "maintain ",
  "reduce speed to ",
  "increase speed to ",
  "maintain speed not less than ",
]

const cancelSpeed = ["resume normal speed when able.", "resume normal speed "]
const cancelHeading = ["cancel heading, resume own navigation. ", "cancel heading. "]
//waypoint phrases
const possibleWaypoint = [
  "cleared direct ",
  "cleared direct to ",
  "fly direct ",
  "fly direct to ",
  "navigate direct ",
  "navigate direct to ",
  "turn direct ",
  "turn direct to ",
  "proceed direct ",
  "proceed direct to ",
]
//possible waypoints
const waypoints = ["GATKI", "JEROM", "KONKA", "SKEAR", "VIRGA", "PELUP", "ARN", "BROMO", "GÖTEBORG"]

function altitudeParameter() {
  let altitude =
    Math.floor(Math.random() * (maximumAltitude - minimumAltitude + 1)) + minimumAltitude
  //make it closest 1000 when above 10000 feet, otherwise closest 500.
  if (altitude < 10000) {
    altitude = Math.round(altitude / 500) * 500
  } else {
    altitude = Math.round(altitude / 1000) * 1000
  }
  console.log(altitude)
  //if altitude is greater than 24 000 - convert to flight level
  let phonetic = ""
  if (altitude >= 24000) phonetic = "Flight level " + callSignToNato((altitude / 100).toString())
  else if (altitude % 1000 !== 500) {
    console.log(altitude)
    phonetic = numberToString((altitude / 1000).toString()) + " thousand feet."
  } else
    phonetic = numberToString((altitude / 1000 - 0.5).toString()) + " thousand five hundred feet"

  return { altitude: altitude, phonetic: phonetic }
}
async function generateAltitudeSentence() {
  try {
    let sentence
    let usedCallsign
    let action
    const i = Math.floor(Math.random() * possibleAltitude.length)
    const obj = await main()
    const chance = Math.random()
    const parameter = altitudeParameter()
    //more often the callsign instead of three letter thingy
    if (chance < 0.7) {
      sentence = obj.phonetic + ", " + possibleAltitude[i] + parameter.phonetic
      usedCallsign = obj.phonetic
    } else {
      sentence = obj.spoken + ", " + possibleAltitude[i] + parameter.phonetic
      usedCallsign = obj.spoken
    }
    if (sentence.includes("level")) {
      action = "cleared flight level"
    } else action = "cleared altitude"
    return {
      sentence: sentence,
      action: action,
      callsignObject: obj,
      usedCallsign: usedCallsign,
      parameterPhonetic: parameter.phonetic,
      parameter: parameter.altitude / 100,
    }
  } catch (error) {
    console.error("error from generateAltitudeSentence: " + error)
  } finally {
    await closeConnection()
  }
}

async function headingParameter() {
  try {
    let usedCallsign
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
    const chance = Math.random()
    //more often the callsign instead of three letter thingy
    if (chance < 0.7) {
      sentence = obj.phonetic + ", " + possibleHeading[i] + headingPhonetic
      usedCallsign = obj.phonetic
    } else {
      sentence = obj.spoken + ", " + possibleHeading[i] + headingPhonetic
      usedCallsign = obj.spoken
    }
    console.log(sentence)
    return {
      sentence: sentence,
      action: "cleared heading",
      callsignObject: obj,
      usedCallsign: usedCallsign,
      parameterPhonetic: headingPhonetic,
      parameter: heading,
    }
  } catch (error) {
    console.error("error from headingParameter: " + error)
  } finally {
    await closeConnection()
  }
}

async function generateSpeedSentence() {
  try {
    let usedCallsign
    let sentence
    let speed = Math.floor(Math.random() * (maximumSpeed - minimumSpeed - 1)) + minimumSpeed
    speed = Math.round(speed / 10) * 10
    let speedPhonetic = callSignToNato(speed.toString()) + " knots"
    let i = Math.floor(Math.random() * possibleSpeed.length)
    let obj = await main()
    const chance = Math.random()
    //more often the callsign instead of three letter thingy
    if (chance < 0.7) {
      sentence = obj.phonetic + ", " + possibleSpeed[i] + speedPhonetic
      usedCallsign = obj.phonetic
    } else {
      sentence = obj.spoken + ", " + possibleSpeed[i] + speedPhonetic
      usedCallsign = obj.spoken
    }
    console.log(sentence)
    return {
      sentence: sentence,
      action: "cleared airspeed",
      callsignObject: obj,
      usedCallsign: usedCallsign,
      parameterPhonetic: speedPhonetic,
      parameter: speed,
    }
  } catch (error) {
    console.error("error from generateSpeedSentence: " + error)
  } finally {
    await closeConnection()
  }
}

async function generateMachSentence() {
  try {
    let usedCallsign
    let sentence
    let speed = Math.random() * (0.85 - 0.75) + 0.75
    speed = Math.round(speed * 100) / 100
    let speedPhonetic = "Mach decimal " + callSignToNato((speed * 100).toString())
    let i = Math.floor(Math.random() * possibleSpeed.length)
    let obj = await main()
    const chance = Math.random()
    //more often the callsign instead of three letter thingy
    if (chance < 0.7) {
      sentence = obj.phonetic + ", " + possibleSpeed[i] + speedPhonetic
      usedCallsign = obj.phonetic
    } else {
      sentence = obj.spoken + ", " + possibleSpeed[i] + speedPhonetic
      usedCallsign = obj.spoken
    }
    console.log(sentence)
    return {
      sentence: sentence,
      action: "cleared mach",
      callsignObject: obj,
      usedCallsign: usedCallsign,
      parameterPhonetic: speedPhonetic,
      parameter: speed,
    }
  } catch (error) {
    console.error("error from generateMachSentence: " + error)
  } finally {
    await closeConnection()
  }
}

async function clearCommandSentence() {
  try {
    const obj = await main()
    const chance1 = Math.random()
    const chance2 = Math.random()
    let sentence
    let usedCallsign
    //cancel heading
    if (chance1 <= 1 / 2) {
      const i = Math.floor(Math.random() * cancelHeading.length)
      if (chance2 < 0.7) {
        sentence = obj.phonetic + ", " + cancelHeading[i]
        usedCallsign = obj.phonetic
      } else {
        sentence = obj.spoken + ", " + cancelHeading[i]
        usedCallsign = obj.spoken
      }
      return {
        sentence: sentence,
        action: "cancel heading",
        callsignObject: obj,
        usedCallsign: usedCallsign,
        parameterPhonetic: null,
        parameter: null,
      }
    }
    //cancel speed
    else {
      const i = Math.floor(Math.random() * cancelSpeed.length)
      if (chance2 < 0.7) {
        sentence = obj.phonetic + ", " + cancelSpeed[i]
        usedCallsign = obj.phonetic
      } else {
        sentence = obj.spoken + ", " + cancelSpeed[i]
        usedCallsign = obj.spoken
      }
      return {
        sentence: sentence,
        action: "cancel speed",
        callsignObject: obj,
        usedCallsign: usedCallsign,
        parameterPhonetic: null,
        parameter: null,
      }
    }
  } catch (error) {
    console.error("error from clearCommandSentence: " + error)
  } finally {
    await closeConnection()
  }
}

async function generateClearedDirect() {
  try {
    let usedCallsign
    let sentence
    let i = Math.floor(Math.random() * possibleWaypoint.length)
    let j = Math.floor(Math.random() * waypoints.length)
    let obj = await main()
    const chance = Math.random()
    //more often the callsign instead of three letter thingy
    if (chance < 0.7) {
      sentence = obj.phonetic + ", " + possibleWaypoint[i] + waypoints[j]
      usedCallsign = obj.phonetic
    } else {
      sentence = obj.spoken + ", " + possibleWaypoint[i] + waypoints[j]
      usedCallsign = obj.spoken
    }
    console.log(sentence)
    return {
      sentence: sentence,
      action: "cleared direct",
      callsignObject: obj,
      usedCallsign: usedCallsign,
      parameterPhonetic: waypoints[j],
      parameter: waypoints[j],
    }
  } catch (error) {
    console.error("error from generateClearedDirect: " + error)
  } finally {
    await closeConnection()
  }
}

export async function generateSentence() {
  const chanceAlternative = Math.random()
  if (chanceAlternative < 0.1) {
    return await clearCommandSentence()
  }
  if (chanceAlternative > 0.9) {
    return await generateClearedDirect()
  }
  const chance = Math.random()
  const numberOfActions = 3
  if (chance <= 1 / numberOfActions) return await generateAltitudeSentence()
  else if (chance > 1 / numberOfActions && chance < 2 / numberOfActions) {
    return await headingParameter()
  } else if (chance > 2 / numberOfActions && chance <= 5 / 6) {
    return await generateSpeedSentence()
  } else {
    return await generateMachSentence()
  }
}
