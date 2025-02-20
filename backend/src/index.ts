import Express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { processTranscription } from "./ai";
import { connectSocketServer } from "./tcp";
const PORT = process.env.PORT || 8080;
const app = Express();

app.use(bodyParser.json());

app.use(cors());

connectSocketServer();

app.post("/processTranscription", async (req, res) => {
	console.log("Processing transcription...", req.body.transcript);
	const transcript = req.body.transcript;
	const processedTranscript = await processTranscription(transcript);
	res.json({ processedTranscript });
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
