const backendPort = 8080;
export const parseTranscribedText = async (transcript: string) => {
	try {
		const response = await fetch(
			`${window.location.protocol}//${window.location.hostname}:${backendPort}/processTranscription`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ transcript }),
			}
		);
		if (!response.ok) {
			console.error("Failed to parse transcribed text:", response.statusText);
			return null;
		}
		const result = await response.json();
		console.log(result);
		return result;
	} catch (error: unknown) {
		console.error("Error parsing transcribed text:", error);
		return null;
	}
};
