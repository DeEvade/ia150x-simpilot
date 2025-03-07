import OpenAI from "openai";
const openai = new OpenAI({
	baseURL: "http://localhost:1234/v1",
	apiKey: "no",
});

export const processTranscription = async (transcript: string) => {
	try {
		const completion = await openai.chat.completions.create({
			model: "qwen2.5-0.5b-instruct",

			messages: [
				{ role: "system", content: transcribeSystemPrompt },
				{
					role: "user",
					content: transcript,
				},
			],
			store: true,
		});

		const result = completion.choices[0].message.content;
		console.log(result);
		return result;
	} catch (error: unknown) {
		console.error("Error processing transcription:", error);
		return null;
	}
};

const transcribeSystemPrompt = `
You will be given a transcribed ATC (Air traffic Controller) command. The command will consist of a call sign, action and a parameter. Your task is to extract this information into JSON format.

You should try to match the callsign to one in the following list.
CallSignList: [“WMT6767”, “ECA2UN”, “EWG1BG”, “QTR17G”, “PGT5RL”, “SAS173”]




Example Input: Echo Whiskey Golf One Bravo Golf Cleared to Flight Level Ninety.

Example Output:
{
	callSign: “EWG1BG”,
	action: “cleared flight level”,
	parameter: 90
}


return a JSON object
`;
