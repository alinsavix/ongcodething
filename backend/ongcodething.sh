#!/bin/bash
# This is all very hacky. Sorry.
# LOG_FILE="server.log"
# PID_FILE="server.pid"


# Function to clean up on exit
# cleanup() {
#     echo "thing: $?"
#     if [ -n "$UVICORN_PID" ]; then
#         kill -TERM $UVICORN_PID 2>/dev/null
#         rm -f "$PID_FILE"
#     fi
# }

# # Set up trap to call cleanup on script exit
# trap cleanup EXIT

MY_DIR=$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")
cd "$MY_DIR" || exit 1

if [ -f .venv/bin/activate ]; then
    source .venv/bin/activate
elif [ -f .venv/Scripts/activate ]; then
    source .venv/Scripts/activate
else
    echo "No virtual environment found"
    exit 1
fi

exec uvicorn main:socket_app --reload --host 0.0.0.0 --port 1077

# UVICORN_PID=$!
# echo $UVICORN_PID > "$PID_FILE"

# wait $UVICORN_PID
