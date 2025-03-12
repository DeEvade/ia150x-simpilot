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

  res.json({ scenario })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
