.PHONY: install frontend start stop test clean realclean test-with-server openapi

# Python interpreter
PYTHON = python3
# PIP = pip3

# Server process management
PID_FILE = backend/server.pid
LOG_FILE = backend/server.log

install:
	cd backend && \
	uv venv && \
	uv pip install -r requirements.txt

frontend:
	cd frontend && npm install && npm run build
	mkdir -p backend/static && cp -r frontend/dist/* backend/static/

start: frontend
	@echo "Starting server..."
	@cd backend && ./ongcodething.sh & echo $$! > "$(PID_FILE)"
	@echo "Server started. PID: $$(cat $(PID_FILE))"

	@# Wait for server to be ready
	@sleep 2

stop:
	@if [ -f $(PID_FILE) ]; then \
		echo "Stopping server processes..."; \
		PID=$$(cat $(PID_FILE)); \
		pkill -P $$PID 2>/dev/null || true; \
		kill -9 $$PID 2>/dev/null || true; \
		rm $(PID_FILE); \
		echo "Server stopped."; \
	else \
		echo "No server PID file found."; \
	fi
	@# Cleanup any remaining uvicorn processes for this app
	@#pkill -f "uvicorn main:app" 2>/dev/null || true

restart: stop start

test:
	cd backend && source .venv/bin/activate && pytest test_main.py -v

clean: stop
	@echo "Cleaning up..."
	@rm -rf $(PID_FILE) $(LOG_FILE) backend/songs.db frontend/dist backend/openapi.json
	@find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete

realclean: clean
	@rm -rf .venv backend/.venv frontend/node_modules

# Run tests with server management
test-with-server: start
	@echo "Running tests..."
	@$(MAKE) test

# Generate OpenAPI definitions
openapi:
	@echo "Generating OpenAPI definitions..."
	@cd backend && source .venv/bin/activate && python -c "import json; from main import app; open('openapi.json', 'w').write(json.dumps(app.openapi(), indent=2))"
	@echo "OpenAPI definitions generated in backend/openapi.json"

# Default target
all: clean install test-with-server
