from fastapi import HTTPException, status, Header, Depends
from pyrebase import initialize_app
from config import get_settings
from fastapi.concurrency import run_in_threadpool

firebase = initialize_app(get_settings().firebase_config)
auth_cli = firebase.auth()

async def get_current_uid(authorization: str = Header(..., alias="Authorization")):
    scheme, token = authorization.split()
    if scheme.lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Bad auth header")

    # 🚀 off-load the blocking HTTPS request
    try:
        info = await run_in_threadpool(auth_cli.get_account_info, token)
        return info["users"][0]["localId"]
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token invalid or expired")

