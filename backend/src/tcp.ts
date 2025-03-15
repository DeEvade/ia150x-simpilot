import * as net from "net"

// Define the TCP server's host and port
const HOST = "194.17.53.68" // Replace with your server's host
const PORT = 7835 // Replace with your server's port

export const connectSocketServer = () => {
  console.log("Connecting to server...")

  // Create a TCP client
  const client = new net.Socket()

  // Connect to the server
  client.connect(PORT, HOST, () => {
    console.log(`Connected to server at ${HOST}:${PORT}`)

    // Send a message to the server
    //client.write("Hello, server!");
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
}
