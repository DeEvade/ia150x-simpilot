#!/bin/bash

SESSION="simsetup"

# Kill old session if it exists (optional safety)
tmux kill-session -t $SESSION 2>/dev/null

# Start new detached session and rename the first window
tmux new-session -d -s $SESSION -n 'Sim-Server'
tmux send-keys -t $SESSION:0 'cd /Users/arontiselius/Documents/Kexjobb/asr_testing/server' C-m
tmux send-keys -t $SESSION:0 'python3 client_test.py' C-m

sleep 5  # give tmux a moment to breathe

# Create Frontend window
tmux new-window -t $SESSION -n 'Frontend'
tmux send-keys -t $SESSION:1 'cd /Users/arontiselius/Documents/Kexjobb/ia150x-simpilot/atc-sim-frontend' C-m
tmux send-keys -t $SESSION:1 'npm run dev' C-m

sleep 5

# Create Backend window
tmux new-window -t $SESSION -n 'Backend'
tmux send-keys -t $SESSION:2 'cd /Users/arontiselius/Documents/Kexjobb/ia150x-simpilot/backend' C-m
tmux send-keys -t $SESSION:2 'npm start' C-m

# Attach to session
tmux attach -t $SESSION

