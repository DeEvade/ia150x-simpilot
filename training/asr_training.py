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

max_length = 512
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

# Create HuggingFace dataset
try:
    dataset = Dataset.from_list(audio_data, features=features)
    print("Dataset created successfully")
except Exception as e:
    print(f"Error creating dataset: {e}")
    exit()

# Load model + processor
model_name = "openai/whisper-small"
processor = WhisperProcessor.from_pretrained(model_name)
model = WhisperForConditionalGeneration.from_pretrained(model_name)

# Device setup
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Using device: {device}")
model.to(device)

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


def data_collator(features):
    # Ensure both 'input_features' and 'labels' are in the feature dicts
    for f in features:
        if "input_features" not in f:
            print(f"Missing 'input_features' in this feature: {f}")
            continue  # skip or handle missing data as needed
        input_feat = np.array(f["input_features"])  # Ensure it's an array
        feature_len = input_feat.shape[-1]

        if feature_len < 3000:
            pad_len = 3000 - feature_len
            pad = np.zeros((input_feat.shape[0], pad_len), dtype=np.float32)
            input_feat = np.concatenate([input_feat, pad], axis=-1)
        elif feature_len > 3000:
            input_feat = input_feat[:, :3000]

        f["input_features"] = input_feat

        if "labels" not in f:
            print(f"Missing 'labels' in this feature: {f}")
            continue  # skip or handle missing labels as needed

    # Safely get the max length for labels
    label_max_length = 0
    label_lengths = [len(f["labels"]) for f in features if "labels" in f]
    if label_lengths:  # Make sure there are labels in the batch
        label_max_length = max(label_lengths)

    for f in features:
        if "labels" in f:
            label_len = len(f["labels"])
            if label_len < label_max_length:
                f["labels"] = f["labels"] + [0] * (label_max_length - label_len)  # pad with zeros
            elif label_len > label_max_length:
                f["labels"] = f["labels"][:label_max_length]  # trim labels

    input_features = torch.tensor([f["input_features"] for f in features if "input_features" in f])
    labels = torch.tensor([f["labels"] for f in features if "labels" in f])

    return {"input_features": input_features, "labels": labels}


# Training args
training_args = Seq2SeqTrainingArguments(
    output_dir="./whisper-finetuned",
    per_device_train_batch_size=2,
    gradient_accumulation_steps=2,
    learning_rate=1e-5,
    warmup_steps=50,
    max_steps=2,
    save_steps=200,
    logging_steps=50,
    predict_with_generate=False,
    evaluation_strategy="no",  # <== Replace with `eval_strategy` later if needed
    fp16=False,  # MPS doesn’t support CUDA-style fp16
    report_to="none",
    remove_unused_columns=False  # Added to prevent automatic removal of unused columns
)

# Trainer
trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset,  # Ensure it's the correct dataset
    tokenizer = AutoTokenizer.from_pretrained("openai/whisper-small", padding=True, truncation=True, max_length=max_length),
    data_collator=data_collator,
)

# Train
print("training")
trainer.train()

# Save model
model.save_pretrained("./whisper-finetuned")
processor.save_pretrained("./whisper-finetuned")

