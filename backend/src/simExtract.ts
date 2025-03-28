import { FlightData } from "../interfaces"

import { parseStringPromise } from "xml2js"

export async function parseFlightData(xmlString: string): Promise<FlightData | null> {
  try {
    const result = await parseStringPromise(xmlString, { explicitArray: false })
    const track = result.NLROut.track
    if (!track) return null
    const ems = track.ems

    const callsign = track.callsign
    const lat = parseFloat(track.lat._)
    const lon = parseFloat(track.lon._)
    const alt = parseFloat(track.alt._)
    const hdg = parseFloat(ems.hdg._)
    const mach = parseFloat(ems.mach._)

    if (!callsign || isNaN(lat) || isNaN(lon) || isNaN(alt) || isNaN(hdg) || isNaN(mach)) {
      return null // Invalid or incomplete data
    }
    const fd: FlightData = {
      callsign,
      lat,
      lon,
      alt,
      hdg,
      mach,
      updatedAt: Date.now(),
    }
    return fd
  } catch (error) {
    //console.error("Error parsing XML:", error)
    return null
  }
}
