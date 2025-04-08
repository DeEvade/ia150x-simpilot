export interface Command {
  callSign: string
  action: string
  parsedAction: Action
  parameter: number
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
