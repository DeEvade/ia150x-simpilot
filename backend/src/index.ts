import Express, { Request, Response } from "express"
import bodyParser from "body-parser"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import { processTranscription } from "./ai"
import { connectSocketServer, sendCommandToServer, validateCommand } from "./tcp"
import dotenv from "dotenv"
import multer from "multer"
import fs from "fs"
import { Command, FlightData } from "../interfaces"
import { clarifyCommand } from "./tts"
import FlightDataStore from "./FlightDataStore"
import { parseAction } from "./utils"
import { transcribeData } from "./asr"
dotenv.config()

const PORT = process.env.PORT || 8080
const app = Express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
})

new FlightDataStore(io)
app.use(bodyParser.json())

app.use(cors())

connectSocketServer(io)

const upload = multer({ dest: "uploads/" })

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from the server!")
})

app.post(
  "/processAudio",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    console.log("Processing audio...")

    if (!req.file) {
      res.status(400).json({ error: "No audio file uploaded" })
      return
    }

    try {
      const audioFilePath = req.file.path
      const audioBuffer = fs.readFileSync(audioFilePath)
      const audioBlob = new Blob([audioBuffer], { type: "audio/wav" })

      const formData = new FormData()
      formData.append("file", audioBlob, req.file.originalname)
      const response = await transcribeData(formData)

      if (response.error) {
        const error = response.error
        console.error("Failed to transcribe audio:", error)
        res.status(response.status).json({ error })
      } else {
        console.log("Transcription result:", response)

        res.json({ text: response })
      }

      // Cleanup: Remove uploaded file
      fs.unlink(audioFilePath, (err) => {
        if (err) console.error("Failed to delete temp file:", err)
      })
    } catch (error: any) {
      console.error("Error processing audio:", error)
      res.status(500).json({ error: error.message })
    }
  },
)

app.post("/processTranscription", async (req: Request, res: Response) => {
  console.log("Processing transcription...", req.body.transcript)
  const transcript = req.body.transcript
  const overrideCallsigns = req.body.overrideCallsigns
  const processedTranscript = await processTranscription(transcript, overrideCallsigns)

  if (processedTranscript === null) {
    res.json({ error: "could not process transcription" })
    return
  }
  console.log("flightcatastore", FlightDataStore.getInstance().getAllFlightData())

  let parsedTranscript = JSON.parse(processedTranscript) as Command
  const parsedAction = parseAction(parsedTranscript.action)
  if (parsedAction === null) {
    res.json({ ...parsedTranscript, error: "could not parse action" })
    return
  }

  parsedTranscript.parsedAction = parsedAction
  //Får vara null för vissa actions, men inte andra.
  //har redan checks i sendcommand grejen, så kanske bättre att kolla där
  //if (parsedTranscript.action == null || parsedTranscript.callSign == null) {
  if (!validateCommand(parsedTranscript)) {
    clarifyCommand()
    res.json({ error: "did not understand command" })
    return
  }
  sendCommandToServer(parsedTranscript)
  console.log("Sent command to server")

  res.json({ processedTranscript })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
