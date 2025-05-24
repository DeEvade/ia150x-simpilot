from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import torch
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from pydub import AudioSegment
import io
import numpy as np

app = FastAPI()

# Load the fine-tuned Whisper model
device = torch.device("mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu")
#model_path = "deevade/whisper-small-finetuned-long"

model_path = "./training/openai/whisper-small-finetuned2"

#model_path = "openai/whisper-tiny"
model = WhisperForConditionalGeneration.from_pretrained(model_path)
model = model.to(device)
processor = WhisperProcessor.from_pretrained(model_path)

@app.post("/v1/audio/transcriptions")
async def transcribe(
    file: UploadFile = File(...),
    prompt: str = Form("")
):
    print(file)
    audio_data = await file.read()

    # Wrap audio data in BytesIO so pydub can handle it
    try:
        audio = AudioSegment.from_file(io.BytesIO(audio_data), format="webm")
    except Exception as e:
        return JSONResponse({"error": f"Failed to decode audio: {str(e)}"}, status_code=400)

    # Convert to mono and 16kHz
    audio = audio.set_channels(1).set_frame_rate(16000)

    # Convert to numpy array and normalize
    dtype_map = {1: np.int8, 2: np.int16, 4: np.int32}
    dtype = dtype_map.get(audio.sample_width)

    if not dtype:
        return JSONResponse({"error": "Unsupported sample width"}, status_code=400)

    samples = np.array(audio.get_array_of_samples()).astype(dtype).astype(np.float32)
    samples /= np.iinfo(dtype).max  # normalize to [-1.0, 1.0]

    # Feed to Whisper
    inputs = processor(audio=samples, sampling_rate=16000, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}   

    prompt_ids = None
    if prompt:
        prompt_tensor = processor.get_prompt_ids(prompt, return_tensors="pt").to(device)
        prompt_ids = prompt_tensor

    # Generate with prompt (if any)
    with torch.no_grad():
        predicted_ids = model.generate(
            inputs["input_features"],
            task="transcribe",
            language="en",
            temperature=0.0,
            prompt_ids=prompt_ids
        )
        
    result_text = processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]

    print("Transcription:", result_text)

    return JSONResponse({
        "text": result_text,
        "language": "en"
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")