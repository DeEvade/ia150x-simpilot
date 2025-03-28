import xml2js from "xml2js"
export function isValidXML(xmlString: string) {
  return new Promise((resolve) => {
    xml2js.parseString(xmlString, (err) => {
      resolve(!err)
    })
  })
}

export const parseAction = (action: string) => {
  action = action.toLowerCase()
  switch (action) {
    case "cleared flight level":
      return {
        name: "clr_fl",
        unit: "fl",
      }
    case "cleared airspeed":
      return {
        name: "clr_ias",
        unit: null,
      }
    case "cleared mach":
      return {
        name: "clr_mach",
        unit: null,
      }
    case "cleared heading":
      return {
        name: "clr_hdg",
        unit: "deg",
      }
    case "cancel speed":
      return {
        name: "clr_ias",
        unit: null,
      }
    case "cancel heading":
      return {
        name: "clr_hdg",
        unit: "deg",
      }
    case "cleared direct":
      return {
        name: "clr_dct",
        unit: null,
      }
    default:
      return null
  }
}
