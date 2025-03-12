import Express from "express"
import bodyParser from "body-parser"
import cors from "cors"
import mongoose from "mongoose"
import dotenv from "dotenv"
import { generateSentence } from "./utils/dataSamples.mjs"

const PORT = process.env.PORT || 8080
const app = Express()

app.use(bodyParser.json())

app.use(cors())

dotenv.config()
console.log(process.env.MONGO_URI)

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: "main",
  })
}
connectDB().then(async () => {
  console.log("Connected to MongoDB")
  await mongoose.connection.db.createCollection("callsigns")
  await mongoose.connection.db.createCollection("speech_samples")
})

app.get("/generateScenario", async (req, res) => {
  const scenario = await generateSentence()
  console.log("Scenario generated: ", scenario)

  res.json(scenario)
})

app.post("/postScenario", async (req, res) => {
  console.log("Received scenario: ")
  if (!req.body.audio) return res.json({ success: false, error: "No audio" })
  await mongoose.connection.db.collection("speech_samples").insertOne(req.body)
  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
