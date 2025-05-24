import datetime as dt
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class Video(Base):
    __tablename__ = "recordings"

    id: Mapped[int]        = mapped_column(primary_key=True, index=True)
    user_uid: Mapped[str] = mapped_column(String(128), index=True)
    filename: Mapped[str]  = mapped_column(String(256))
    s3_key: Mapped[str]    = mapped_column(String(512), unique=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)
