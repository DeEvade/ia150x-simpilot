from pymongo import MongoClient
import base64
import io
import torch
import torchaudio
from pydub import AudioSegment
from datasets import Dataset, Audio, Value, Features
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from transformers import Seq2SeqTrainer, Seq2SeqTrainingArguments
import numpy as np
from transformers import AutoTokenizer
from huggingface_hub import login

login()


# Decode base64 audio to tensor
def decode_base64_audio(b64_string):
    audio_bytes = base64.b64decode(b64_string)
    audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
    audio = audio.set_channels(1)  # Mono
    wav_bytes = io.BytesIO()
    audio.export(wav_bytes, format="wav")
    wav_bytes.seek(0)
    waveform, sr = torchaudio.load(wav_bytes)
    return waveform.squeeze(0)


# Connect to MongoDB
client = MongoClient("mongodb://vm.cloud.cbh.kth.se:20136/")
db = client["main"]
collection = db["speech_samples"]

docs = list(collection.find({
    "audio": {"$type": "string"},
    "sentence": {"$type": "string"}
}))

# Process audio
audio_data = []
print(f"Found {len(docs)} documents in the collection.")
for doc in docs:
    try:
        if "audio" in doc:
            audio_tensor = decode_base64_audio(doc["audio"])
            audio_data.append({
                "audio": {"array": audio_tensor, "sampling_rate": 16000},
                "sentence": doc["sentence"]
            })
    except Exception as e:
        print(f"Error processing document: {e}")

if not audio_data:
    print("No valid audio data processed. Exiting.")
    exit()

print(f"Processed {len(audio_data)} documents.")

# Features for dataset
features = Features({
    "audio": Audio(sampling_rate=16000),
    "sentence": Value(dtype="string")
})

# Load model + processor
model_name = "openai/whisper-base"
print(f"Loading model {model_name}...")
processor = WhisperProcessor.from_pretrained(model_name)
model = WhisperForConditionalGeneration.from_pretrained(model_name)

# Device setup
# cuda

if torch.backends.mps.is_available():
    print("MPS is available")
    device = torch.device("mps")
else:
    print("MPS is not available, checking for CUDA")
    if torch.cuda.is_available():
        print("CUDA is available")
        device = torch.device("cuda")
    else:
        print("No GPU available, using CPU")
        device = torch.device("cpu")

print(f"Using device: {device}")
model.to(device)




def data_collator(features):
    for f in features:
        if "input_features" not in f:
            print(f"Missing 'input_features' in this feature: {f}")
            continue
        
        input_feat = np.array(f["input_features"], dtype=np.float32)  # Force float32 here
        feature_len = input_feat.shape[-1]

        if feature_len < 3000:
            pad_len = 3000 - feature_len
            pad = np.zeros((input_feat.shape[0], pad_len), dtype=np.float32)
            input_feat = np.concatenate([input_feat, pad], axis=-1)
        elif feature_len > 3000:
            input_feat = input_feat[:, :3000]

        f["input_features"] = input_feat.astype(np.float32)  # Ensure float32 right before using

        if "labels" not in f:
            print(f"Missing 'labels' in this feature: {f}")
            continue

    label_max_length = 0
    label_lengths = [len(f["labels"]) for f in features if "labels" in f]
    if label_lengths:
        label_max_length = max(label_lengths)


    for f in features:
        if "labels" in f:
            label_len = len(f["labels"])
            if label_len < label_max_length:
                f["labels"] = f["labels"] + [0] * (label_max_length - label_len)  # pad with zeros
            elif label_len > label_max_length:
                f["labels"] = f["labels"][:label_max_length]  # trim labels

    input_features = torch.tensor([f["input_features"] for f in features if "input_features" in f], dtype=torch.float32)
    labels = torch.tensor([f["labels"] for f in features if "labels" in f])

    return {"input_features": input_features, "labels": labels}



def preprocess(batch):
    audio = batch["audio"]
    
    # Process the audio to get features
    inputs = processor(audio["array"], sampling_rate=16000, return_tensors="pt", padding="longest")
    
    # Tokenize the sentence
    labels = processor.tokenizer(batch["sentence"], return_tensors="pt", padding="longest", truncation=True).input_ids

    # Check if labels are being generated properly
    print(f"Generated labels: {labels}")
    print(f"Labels shape: {labels.shape}")

    return {
        "input_features": inputs.input_features[0],  # Ensure we're using the first element
        "labels": labels[0]  # Ensure labels are correctly added
    }


# Create HuggingFace dataset
try:
    dataset = Dataset.from_list(audio_data, features=features)
    print("Dataset created successfully")
except Exception as e:
    print(f"Error creating dataset: {e}")
    exit()
dataset = dataset.map(preprocess)

#save dataset to disk
dataset.save_to_disk("dataset")


outdir = f"./{model_name}-finetuned2"

# Training args
training_args = Seq2SeqTrainingArguments(
    output_dir=outdir,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    learning_rate=1e-5,
    warmup_steps=50,
    max_steps=len(docs)*4,
    save_steps=len(docs),
    logging_steps=50,
    predict_with_generate=False,
    evaluation_strategy="no",  # <== Replace with `eval_strategy` later if needed
    fp16=False,  # MPS doesn’t support CUDA-style fp16
    report_to="none",
    save_safetensors=False,
    remove_unused_columns=False  # Added to prevent automatic removal of unused columns
)

# Trainer
trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset,  # Ensure it's the correct dataset
    tokenizer = processor,
    data_collator=data_collator,
)

# Train
print("training")
trainer.train()

trainer.save_model(outdir)

# Save model
model.save_pretrained(outdir)
processor.save_pretrained(outdir)
model.push_to_hub(f"deevade/whisper-small")
print("Model saved")
