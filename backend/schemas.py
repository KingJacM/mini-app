import datetime as dt
from pydantic import BaseModel

class VideoOut(BaseModel):
    id: int
    filename: str
    s3_url: str
    created_at: dt.datetime
    class Config:
        orm_mode = True

class RenameIn(BaseModel):
    filename: str
