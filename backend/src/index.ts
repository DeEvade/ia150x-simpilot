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
import { CallsignObject, Command, FlightData, TTSObject } from "../interfaces"
import { clarifyCommand, commandToSpeech } from "./tts"
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
      const audioFormat = req.file.mimetype

      const audioBlob = new Blob([audioBuffer], { type: "audio/webm" })
      const overrideCallsigns: CallsignObject[] = JSON.parse(req.body.overrideCallsigns || "[]")

      const formData = new FormData()
      formData.append("file", audioBlob, req.file.originalname)
      const response = await transcribeData(formData, overrideCallsigns)

      if (response.error) {
        const error = response.error
        console.error("Failed to transcribe audio:", error)
        res.status(500).json({ error })
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
  try {
    console.log("Processing transcription...", req.body.transcript)
    const transcript = req.body.transcript
    const skipTTS = req.body.skipTTS
    const overrideCallsigns: CallsignObject[] = req.body.overrideCallsigns
    const processedTranscript = await processTranscription(transcript, overrideCallsigns)

    if (processedTranscript === null) {
      res.json({ error: "could not process transcription" })
      return
    }
    //console.log("flightcatastore", FlightDataStore.getInstance().getAllFlightData())
    let parsedTranscript
    try {
      parsedTranscript = JSON.parse(processedTranscript) as Command
    } catch (error) {
      console.log("Error parsing JSON:", error)
      console.log("Processed transcript that had error:", processedTranscript)
      throw error
    }
    const parsedAction = parseAction(parsedTranscript.action)

    if (overrideCallsigns) {
      res.json({
        processedTranscript,
      })
      return
    }
    if (parsedAction === null) {
      const ttsResult = await clarifyCommand(skipTTS)
      res.json({
        audio: ttsResult.audio,
        pilotSentence: ttsResult.pilotSentence,
        error: "did not understand command",
      })
      return
    }

    parsedTranscript.parsedAction = parsedAction
    if (!validateCommand(parsedTranscript)) {
      const ttsResult = await clarifyCommand(skipTTS)
      res.json({
        audio: ttsResult.audio,
        pilotSentence: ttsResult.pilotSentence,
        error: "did not understand command",
      })
      return
    }

    sendCommandToServer(parsedTranscript)
    console.log("Sent command to server")
    console.log("getting tts")
    const ttsResult: TTSObject = await commandToSpeech(parsedTranscript, skipTTS)
    //console.log(ttsResult)
    res.json({
      processedTranscript: processedTranscript,
      audio: ttsResult?.audio,
      pilotSentence: ttsResult?.pilotSentence,
    })
  } catch (error) {
    console.log("Error processing transcription:", error)
    res.status(500).json({ error: "Error processing transcription" })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
