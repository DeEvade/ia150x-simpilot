import xml2js from "xml2js"
import { Action } from "../interfaces"
export function isValidXML(xmlString: string) {
  return new Promise((resolve) => {
    xml2js.parseString(xmlString, (err) => {
      resolve(!err)
    })
  })
}

export const ActionTypes = Object.freeze({
  CLEARED_FLIGHT_LEVEL: "cleared flight level",
  CLEARED_ALTITUDE: "cleared altitude",
  CLEARED_AIRSPEED: "cleared airspeed",
  CLEARED_MACH: "cleared mach",
  CLEARED_HEADING: "cleared heading",
  CANCEL_SPEED: "cancel speed",
  CANCEL_HEADING: "cancel heading",
  CLEARED_DIRECT: "cleared direct",
})

const actionMap = {
  [ActionTypes.CLEARED_FLIGHT_LEVEL]: { name: "clr_fl", unit: "fl" },
  [ActionTypes.CLEARED_ALTITUDE]: { name: "not a real command", unit: "ft" },
  [ActionTypes.CLEARED_AIRSPEED]: { name: "clr_ias", unit: null },
  [ActionTypes.CLEARED_MACH]: { name: "clr_mach", unit: null },
  [ActionTypes.CLEARED_HEADING]: { name: "clr_hdg", unit: "deg" },
  [ActionTypes.CANCEL_SPEED]: { name: "clr_ias", unit: null },
  [ActionTypes.CANCEL_HEADING]: { name: "clr_hdg", unit: "deg" },
  [ActionTypes.CLEARED_DIRECT]: { name: "clr_dct", unit: null },
}

export const parseAction = (action: string) => {
    if(!action){
        console.error("no discernable action")
        return null;
    }
  return actionMap[action.toLowerCase() as keyof typeof actionMap] || null
}

