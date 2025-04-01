export interface Command {
  callSign: string
  action: string
  parsedAction: Action
  parameter: number
  error?: string
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
