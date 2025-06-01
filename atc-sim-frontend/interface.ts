export interface Command {
  callSign: string
  action: string
  parsedAction: Action
  parameter: number | string
}

export interface Action {
  name: string
  unit: string | null
}
