from datetime import datetime
from typing import Optional

from models import SongStatus
from pydantic import BaseModel


class SongBase(BaseModel):
    title: str
    body: str
    status: Optional[SongStatus] = SongStatus.PENDING

class SongCreate(SongBase):
    pass

class SongUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    status: Optional[SongStatus] = None

class SongResponse(SongBase):
    song_id: int
    created_at: datetime

    class Config:
        from_attributes = True
