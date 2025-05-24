import uuid, boto3, mimetypes
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile
from models import Video
from config import get_settings
import os
from fastapi.concurrency import run_in_threadpool

settings = get_settings()
s3 = boto3.client(
    "s3",
    region_name=settings.aws_region,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)


async def list_videos(db: AsyncSession, uid: str):
    res = await db.execute(select(Video).where(Video.user_uid == uid))
    return res.scalars().all()

async def save_upload(db: AsyncSession, uid: str, file: UploadFile, filename: str):
    ext = mimetypes.guess_extension(file.content_type) or ".webm"
    key = f"{uid}/{uuid.uuid4()}{ext}"

    # 🚀 move the blocking I/O off the event loop
    await run_in_threadpool(
        s3.upload_fileobj,
        file.file,
        settings.s3_bucket,
        key,
        ExtraArgs={"ContentType": file.content_type},
    )

    video = Video(user_uid=uid, filename=filename, s3_key=key)
    db.add(video)
    await db.commit()
    await db.refresh(video)
    return video

async def presigned_url_async(key: str, exp: int = 3600):
    return await run_in_threadpool(
        s3.generate_presigned_url,
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=exp,
    )


async def delete_video(db: AsyncSession, uid: str, vid: Video):
    s3.delete_object(Bucket=settings.s3_bucket, Key=vid.s3_key)
    await db.delete(vid)
    await db.commit()

# def presigned_url(key: str, expires: int = 3600):
#     return s3.generate_presigned_url("get_object",
#         Params={"Bucket": settings.s3_bucket, "Key": key},
#         ExpiresIn=expires)
