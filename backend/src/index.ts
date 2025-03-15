import Express, { Request, Response } from "express"
import bodyParser from "body-parser"
import cors from "cors"
import { processTranscription } from "./ai"
import { connectSocketServer } from "./tcp"
import dotenv from "dotenv"
import multer from "multer"
import fs from "fs"
dotenv.config()

const PORT = process.env.PORT || 8080
const app = Express()
app.use(bodyParser.json())

app.use(cors())

connectSocketServer()

const upload = multer({ dest: "uploads/" })

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
      formData.append("model", "whisper-1")

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Failed to transcribe audio:", errorText)
        res.status(response.status).json({ error: errorText })
      } else {
        const data = await response.json()
        res.json({ text: data.text })
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

app.post("/processTranscription", async (req, res) => {
  console.log("Processing transcription...", req.body.transcript)
  const transcript = req.body.transcript
  const processedTranscript = await processTranscription(transcript)
  res.json({ processedTranscript })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
