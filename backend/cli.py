#!/usr/bin/env python
from typing import Optional

import click
import httpx
from rich.console import Console
from rich.table import Table

BASE_URL = "http://localhost:1077"
console = Console()

def create_client():
    return httpx.Client(base_url=BASE_URL)

@click.group()
def cli():
    """CLI tool to manage songs in the queue."""
    pass

@cli.command()
def list_songs():
    """List all songs in the queue."""
    try:
        with create_client() as client:
            response = client.get("/songs/")
            songs = response.json()

            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("ID")
            table.add_column("Title")
            table.add_column("Body")
            table.add_column("Status")
            table.add_column("Created At")

            for song in songs:
                table.add_row(
                    str(song["song_id"]),
                    song["title"],
                    song["body"],
                    song.get("status", "PENDING"),
                    song["created_at"]
                )

            console.print(table)
    except Exception as e:
        console.print(f"[red]Error: {str(e)}[/red]")

@cli.command()
@click.option("--title", "-t", required=True, help="Song title")
@click.option("--body", "-b", required=True, help="Song body")
def add(title: str, body: str):
    """Add a new song to the queue."""
    try:
        with create_client() as client:
            response = client.post(
                "/songs/",
                json={
                    "title": title,
                    "body": body
                }
            )
            song = response.json()
            console.print("[green]Song added successfully![/green]")
            console.print(f"Song ID: {song['song_id']}")
    except Exception as e:
        console.print(f"[red]Error: {str(e)}[/red]")

@cli.command()
@click.argument("song_id", type=int)
@click.option("--status", "-s", type=click.Choice(["PENDING", "DONE", "SKIPPED"], case_sensitive=False),
              required=True, help="New status for the song")
def update(song_id: int, status: str):
    """Update the status of a song."""
    try:
        with create_client() as client:
            # First get the current song
            response = client.get(f"/songs/{song_id}")
            if response.status_code == 404:
                console.print("[red]Error: Song not found[/red]")
                return

            song = response.json()
            # Update the status
            song["status"] = status.upper()

            # Send the update
            response = client.put(f"/songs/{song_id}", json=song)
            if response.status_code == 200:
                console.print(f"[green]Successfully updated song status to {status}[/green]")
            else:
                console.print("[red]Error updating song status[/red]")
    except Exception as e:
        console.print(f"[red]Error: {str(e)}[/red]")

@cli.command()
def clear():
    """Clear all songs from the database."""
    try:
        with create_client() as client:
            response = client.delete("/songs/clear")
            if response.status_code == 200:
                console.print("[green]Successfully cleared all songs from the database[/green]")
            else:
                console.print("[red]Error clearing songs[/red]")
    except Exception as e:
        console.print(f"[red]Error: {str(e)}[/red]")

if __name__ == "__main__":
    cli()
