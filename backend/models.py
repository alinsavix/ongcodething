import datetime
import os
from enum import Enum

from peewee import (AutoField, CharField, DateTimeField, Model, SqliteDatabase,
                    TextField)

# Initialize SQLite database
db = SqliteDatabase('songs.db')

class SongStatus(str, Enum):
    PENDING = "PENDING"
    DONE = "DONE"
    SKIPPED = "SKIPPED"

class BaseModel(Model):
    class Meta:
        database = db

class Song(BaseModel):
    song_id = AutoField(primary_key=True)
    title = CharField()
    body = TextField()
    status = CharField(default=SongStatus.PENDING)
    created_at = DateTimeField(default=datetime.datetime.now)

    class Meta:
        table_name = 'songs'

def initialize_db():
    db.connect(reuse_if_open=True)
    db.create_tables([Song])
    db.close()
