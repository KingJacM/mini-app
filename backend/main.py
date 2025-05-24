from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from dependencies import get_db
from auth import get_current_uid
import crud, schemas, models, database

app = FastAPI(title="Video-Rec-Demo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # tighten in prod!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create tables at start-up
@app.on_event("startup")
async def on_startup():
    async with database.engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

@app.get("/videos", response_model=list[schemas.VideoOut])
async def list_my_videos(
    db: AsyncSession = Depends(get_db),
    uid: str = Depends(get_current_uid)
):
    vids = await crud.list_videos(db, uid)
    return [
        schemas.VideoOut(
            id=v.id,
            filename=v.filename,
            s3_url=await crud.presigned_url_async(v.s3_key),
            created_at=v.created_at,
        )
        for v in vids
    ]

@app.post("/videos/upload", response_model=schemas.VideoOut, status_code=201)
async def upload_video(
    filename: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    uid: str = Depends(get_current_uid)
):
    if file.content_type not in ("video/webm", "video/mp4"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unsupported content-type")
    v = await crud.save_upload(db, uid, file, filename)
    return schemas.VideoOut(
        id=v.id,
        filename=v.filename,
        s3_url=await crud.presigned_url_async(v.s3_key),
        created_at=v.created_at,
    )

@app.patch("/videos/{video_id}", response_model=schemas.VideoOut)
async def rename_video(
    video_id: int,
    body: schemas.RenameIn,
    db: AsyncSession = Depends(get_db),
    uid: str = Depends(get_current_uid)
):
    v: models.Video | None = await db.get(models.Video, video_id)
    if not v or v.user_uid != uid:
        raise HTTPException(status.HTTP_404_NOT_FOUND)
    v.filename = body.filename
    await db.commit()
    await db.refresh(v)
    return schemas.VideoOut(
        id=v.id,
        filename=v.filename,
        s3_url=await crud.presigned_url_async(v.s3_key),
        created_at=v.created_at,
    )

@app.delete("/videos/{video_id}", status_code=204)
async def delete_video(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    uid: str = Depends(get_current_uid)
):
    v: models.Video | None = await db.get(models.Video, video_id)
    if not v or v.user_uid != uid:
        raise HTTPException(status.HTTP_404_NOT_FOUND)
    await crud.delete_video(db, uid, v)
