import json
import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, List, Optional

import socketio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from models import Song, SongStatus, db
from schemas import SongCreate, SongResponse, SongUpdate

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for FastAPI application."""
    # Connect to the database and create tables on startup
    if not os.getenv("TESTING"):  # Skip if in testing mode
        db.connect()
        db.create_tables([Song], safe=True)
    yield
    # Close database connection on shutdown
    if not os.getenv("TESTING") and not db.is_closed():  # Skip if in testing mode
        db.close()

# Create FastAPI app
app = FastAPI(lifespan=lifespan)

# Configure CORS first
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
@app.post("/songs/", response_model=SongResponse)
async def create_song(song: SongCreate):
    with db:
        db_song = Song.create(
            title=song.title,
            body=song.body,
            status=song.status
        )
        song_response = SongResponse.from_orm(db_song)
        await broadcast_update(f"New song added: {song.title}", song_response)
        return song_response

@app.get("/songs/", response_model=List[SongResponse])
async def list_songs():
    with db:
        songs = Song.select()
        return [SongResponse.from_orm(song) for song in songs]

@app.get("/songs/{song_id}", response_model=SongResponse)
async def get_song(song_id: int):
    with db:
        try:
            song = Song.get(Song.song_id == song_id)
            return SongResponse.from_orm(song)
        except Song.DoesNotExist:
            raise HTTPException(status_code=404, detail="Song not found")

@app.put("/songs/{song_id}", response_model=SongResponse)
async def update_song(song_id: int, song: SongUpdate):
    with db:
        try:
            db_song = Song.get(Song.song_id == song_id)

            # Only update fields that are provided
            if song.title is not None:
                db_song.title = song.title
            if song.body is not None:
                db_song.body = song.body
            if song.status is not None:
                db_song.status = song.status

            db_song.save()
            song_response = SongResponse.from_orm(db_song)
            await broadcast_update(f"Song updated: {db_song.title}", song_response)
            return song_response
        except Song.DoesNotExist:
            raise HTTPException(status_code=404, detail="Song not found")

@app.delete("/songs/clear")
async def clear_songs():
    """Clear all songs from the database."""
    with db:
        Song.delete().execute()
        await broadcast_update("All songs cleared from database")
        return {"message": "All songs cleared successfully"}

# Mount the static files from the frontend build
app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

# Serve index.html for all other routes (must be last)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    return FileResponse("static/index.html")

# Create ASGIApp for Socket.IO
socket_app = socketio.ASGIApp(
    socketio_server=sio,
    other_asgi_app=app
)

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

async def broadcast_update(message: str, song_data: Optional[SongResponse] = None):
    """Send a message and song data to all connected Socket.IO clients."""
    print(f"Broadcasting message: {message}")  # Debug log

    # Convert song data to dict and handle datetime serialization
    song_dict = None
    if song_data:
        song_dict = song_data.dict()
        # Convert datetime to ISO format string
        if 'created_at' in song_dict:
            song_dict['created_at'] = song_dict['created_at'].isoformat()

    await sio.emit('song_update', {
        'message': message,
        'song': song_dict
    })
