# Song Management API

A FastAPI-based server that provides an API for managing songs with real-time updates via WebSocket.

## Features

- Create new songs with title and body
- Retrieve specific songs by ID
- Update song status (PENDING, DONE, SKIPPED)
- List all songs
- Real-time updates via WebSocket for new songs and status changes
- SQLite database persistence using Peewee ORM

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
uvicorn main:app --reload
```

The server will start at `http://localhost:1077`

## API Endpoints

### Create a Song
```http
POST /songs/
Content-Type: application/json

{
    "title": "Song Title",
    "body": "Song Body"
}
```

### Get a Song
```http
GET /songs/{song_id}
```

### List All Songs
```http
GET /songs/
```

### Update Song Status
```http
PATCH /songs/{song_id}
Content-Type: application/json

{
    "status": "DONE"  // Can be "PENDING", "DONE", or "SKIPPED"
}
```

## WebSocket Updates

Connect to the WebSocket endpoint at `ws://localhost:1077/ws/` to receive real-time updates when songs are created or their status changes.

### WebSocket Message Format

For new songs:
```json
{
    "type": "create",
    "song": {
        "id": 1,
        "title": "Song Title",
        "status": "PENDING"
    }
}
```

For status updates:
```json
{
    "type": "update",
    "song": {
        "id": 1,
        "title": "Song Title",
        "status": "DONE"
    }
}
```

## Interactive API Documentation

Visit `http://localhost:1077/docs` for the interactive Swagger documentation of all available endpoints. 



## Extra notes

Start the API server: `uvicorn main:socket_app --reload --port 1077`

Start the webapp server: `npm run dev`
