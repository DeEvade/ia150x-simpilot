

model=https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct
volume=$PWD/data # share a volume with the Docker container to avoid downloading weights every run

docker run --gpus all --shm-size 1g -p 8080:80 -v $volume:/data \
    ghcr.io/huggingface/text-generation-inference:3.1.0 \
    --model-id $model