import * as net from "net"
import { Command, FlightData, Action } from "../interfaces"
import { parseFlightData } from "./simExtract"
import { isValidXML, ActionTypes } from "./utils"
import { Server } from "socket.io"
import FlightDataStore from "./FlightDataStore"

// Define the TCP server's host and port
const HOST = "194.17.53.68" // Replace with your server's host
const PORT = 7835 // Replace with your server's port
// Create a TCP client
const client = new net.Socket()

export const connectSocketServer = (io: Server) => {
  console.log("Connecting to server...")
  const flightDataStore = FlightDataStore.getInstance()

  // Connect to the server
  client.connect(PORT, HOST, () => {
    console.log(`Connected to server at ${HOST}:${PORT}`)
  })

  // Listen for data from the server
  client.on("data", async (data) => {
    //    console.log("Received from server:", data.toString())

    if (!(await isValidXML(data.toString()))) return
    //console.log("Received from server:", data.toString())
    const parsedFlightData = await parseFlightData(data.toString())
    if (!parsedFlightData) return
    //console.log("Parsed flight data:", parsedFlightData)
    flightDataStore.setFlightData(parsedFlightData.callsign, parsedFlightData)
  })

  // Handle connection closure
  client.on("close", () => {
    console.log("Connection closed")
  })

  // Handle errors
  client.on("error", (err) => {
    console.error("Error:", err.message)
  })
} /*
Example Output:
{
	callSign: “EWG1BG”,
	action: “cleared flight level”,
	parameter: 90
}*/
const buildCommandString = (parameters: Command) => {
  try {
    const message = `<?xml version="1.0" encoding="UTF-8"?><NLRIn source="NARSIM" xmlns:sti="http://www.w3.org/2001/XMLSchema-instance"><flightplan>
 <callsign>${parameters.callSign}</callsign><${parameters.parsedAction.name}${
      parameters.parsedAction.unit ? ` unit=${parameters.parsedAction.unit}` : ``
    }>${!parameters.parameter ? "" : parameters.parameter}</${
      parameters.parsedAction.name
    }></flightplan></NLRIn>`
    return message
  } catch (error) {
    console.error(error)
    return null
  }
}

export const sendCommandToServer = (command: Command) => {
  const commandString = buildCommandString(command)
  console.log("Sending command to server:", commandString)

  if (commandString === null) {
    //parseFailed() //funktionen skickar till t2s som säger åt flygledaren att prata tydligare och bättre
  } else {
    client.write(commandString)
    console.log("Command sent to server")
  }
}

export const validateCommand = async (command: Command) => {
  if (command.action === null || command.callSign === null) return false
  //callsign matches list??
  const flightDataStore = FlightDataStore.getInstance()
  const callSignMatch = flightDataStore.getFlightData(command.callSign)
  console.log("callsign : " + command.callSign + "callsignmatch: ", callSignMatch)
  if (!callSignMatch) return false

  if (
    !Object.values(ActionTypes).some(
      (action) => action.toLowerCase() === command.action.toLowerCase(),
    )
  ) {
    //extremt ful - måste ju gå att göra bättre
    return false
  }
  //const validTypeOfParamter = ...
  // ex om type är "FL" så måste parametern vara number
  // Skulle också vara nice om vi returnerade exakt vad som var fel och samlade in statistik
  // t ex 80% på callsigns, 90% på actions ...

  return true
}
/*
validateCommand(
    {
  callSign: "SAS123",
  action: "cleared flight level",
  parsedAction: "" as unknown as Action,
  parameter: 100
    }
)
*/
