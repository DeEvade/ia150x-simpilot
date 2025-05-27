export interface Command {
  callSign: string
  action: string
  parsedAction: Action
  parameter: number | string
}

export interface CallsignObject {
  written: string
  spoken: string
  phonetic: string
}

export interface Action {
  name: string
  unit: string | null
}

export interface FlightData {
  callsign: string
  callsignICAO: string
  lat: number //rad
  lon: number //rad
  alt: number //meter
  hdg: number //rad
  mach: number
  updatedAt: number
}

export interface Callsign {
  tlcs: string
  cs: string
}

export interface TTSObject {
  audio: string
  pilotSentence: string
}
