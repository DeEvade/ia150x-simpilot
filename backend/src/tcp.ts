import * as net from "net"
import { Command } from "../interfaces"
// Define the TCP server's host and port
const HOST = "194.17.53.68" // Replace with your server's host
const PORT = 7835 // Replace with your server's port

// Create a TCP client
const client = new net.Socket()
export const connectSocketServer = () => {
  console.log("Connecting to server...")

  // Connect to the server
  client.connect(PORT, HOST, () => {
    console.log(`Connected to server at ${HOST}:${PORT}`)
  })

  // Listen for data from the server
  client.on("data", (data) => {
    console.log("Received from server:", data.toString())
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
 <callsign>${parameters.callSign}</callsign><${parameters.action}>${parameters.parameter}</${parameters.action}</flightplan></NLRIn>`
    return message
  } catch (error) {
    console.error(error)
    return null
  }
}
export const sendCommandToServer = (command: Command) => {
  const commandString = buildCommandString(command)
  if (commandString === null) {
    //parseFailed() //funktionen skickar till t2s som säger åt flygledaren att prata tydligare och bättre
  } else {
    client.write(commandString)
  }
}
