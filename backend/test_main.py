import asyncio
import json
import os
from typing import Generator

import httpx
import pytest
import socketio

# Server configuration
BASE_URL = "http://localhost:1077"

@pytest.fixture
def client() -> Generator[httpx.Client, None, None]:
    with httpx.Client(base_url=BASE_URL) as client:
        yield client

def test_create_song(client: httpx.Client):
    """Test creating a new song"""
    response = client.post(
        "/songs/",
        json={"title": "Test Song", "body": "Test song content"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Song"
    assert data["body"] == "Test song content"
    assert "song_id" in data
    assert "created_at" in data

def test_get_song(client: httpx.Client):
    """Test retrieving a specific song"""
    # First create a song
    create_response = client.post(
        "/songs/",
        json={"title": "Test Song", "body": "Test song content"}
    )
    song_id = create_response.json()["song_id"]

    # Then retrieve it
    response = client.get(f"/songs/{song_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["song_id"] == song_id
    assert data["title"] == "Test Song"
    assert data["body"] == "Test song content"

def test_get_nonexistent_song(client: httpx.Client):
    """Test retrieving a song that doesn't exist"""
    response = client.get("/songs/99999")  # Use a large number that's unlikely to exist
    assert response.status_code == 404
    assert response.json()["detail"] == "Song not found"

def test_list_songs(client: httpx.Client):
    """Test listing all songs"""
    # Create a few songs
    songs = [
        {"title": f"Song {i}", "body": f"Content for song {i}"}
        for i in range(3)
    ]
    for song in songs:
        client.post("/songs/", json=song)

    # Get the list
    response = client.get("/songs/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3  # Use >= since there might be other songs in the database
    assert any(song["title"].startswith("Song ") for song in data)

@pytest.mark.asyncio
async def test_websocket():
    """Test Socket.IO notifications"""
    # Create Socket.IO client
    sio = socketio.AsyncClient()
    message_received = asyncio.Event()
    received_messages = []

    @sio.event
    async def connect():
        print("Connected to Socket.IO server")

    @sio.event
    async def disconnect():
        print("Disconnected from Socket.IO server")

    @sio.event
    async def message(data):
        print(f"Received message: {data}")
        received_messages.append(data)
        message_received.set()

    # Connect to the server
    await sio.connect(BASE_URL, wait_timeout=5)
    assert sio.connected

    try:
        # Create HTTP client for API requests
        async with httpx.AsyncClient(base_url=BASE_URL) as http_client:
            # Create a new song via REST API
            response = await http_client.post(
                "/songs/",
                json={"title": "Socket.IO Test", "body": "Test song content"}
            )
            assert response.status_code == 200
            song_data = response.json()

            # Wait for the message
            try:
                await asyncio.wait_for(message_received.wait(), timeout=5.0)

                # Verify we received a message
                assert len(received_messages) > 0
                assert isinstance(received_messages[0], dict)
                assert 'data' in received_messages[0]
                assert 'Socket.IO Test' in received_messages[0]['data']
            except asyncio.TimeoutError:
                pytest.fail("Socket.IO message not received within timeout")
    finally:
        # Disconnect the client
        await sio.disconnect()

def test_clear_songs(client: httpx.Client):
    """Test clearing all songs from the database"""
    # First create a few songs
    songs = [
        {"title": f"Song {i}", "body": f"Content for song {i}"}
        for i in range(3)
    ]
    for song in songs:
        client.post("/songs/", json=song)

    # Verify songs were created
    response = client.get("/songs/")
    assert response.status_code == 200
    initial_songs = response.json()
    assert len(initial_songs) >= 3

    # Clear all songs
    response = client.delete("/songs/clear")
    assert response.status_code == 200
    assert response.json()["message"] == "All songs cleared successfully"

    # Verify songs were cleared
    response = client.get("/songs/")
    assert response.status_code == 200
    final_songs = response.json()
    assert len(final_songs) == 0
