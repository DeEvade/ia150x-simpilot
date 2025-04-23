from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel
import uvicorn
import tempfile

app = FastAPI()

model = WhisperModel("large-v3-turbo", compute_type="int8")

@app.post("/v1/audio/transcriptions")
async def transcribe(
    file: UploadFile = File(...),  # Audio file
    prompt: str = Form("")  # Prompt from the user (optional)
):
    # Save the uploaded audio file
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    # Transcribe the audio
    segments, info = model.transcribe(tmp_path, beam_size=5, language="en", initial_prompt=prompt)
    result_text = "".join([segment.text for segment in segments])
    
    return JSONResponse({
        "text": result_text,
        "language": info.language
    })

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
