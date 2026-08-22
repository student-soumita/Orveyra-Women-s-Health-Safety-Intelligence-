import os
import datetime
from typing import Optional
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Security, Depends, status, Response, Request
from fastapi.security import APIKeyCookie, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import User, UserProfile, AuditLog

SECRET_KEY = os.getenv("SECRET_KEY", "orveyra_super_secret_jwt_key_change_in_production_2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
cookie_scheme = APIKeyCookie(name="orveyra_session", auto_error=False)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: datetime.timedelta = None) -> str:
    to_encode = data.copy()
    now = datetime.datetime.now(datetime.timezone.utc)
    expire = now + (expires_delta or datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Session token invalid or expired: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(
    request: Request,
    token_cookie: str = Depends(cookie_scheme),
    db: Session = Depends(get_db)
) -> User:
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    
    if not token:
        token = token_cookie

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in.",
        )

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User account no longer exists")

    return user

def get_optional_current_user(
    request: Request,
    token_cookie: str = Depends(cookie_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    
    if not token:
        token = token_cookie

    if not token:
        return None

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        return None

def log_audit(db: Session, user_id: int, action: str, endpoint: str = None, client_ip: str = None):
    audit = AuditLog(
        user_id=user_id,
        action=action,
        endpoint=endpoint,
        client_ip=client_ip,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(audit)
    db.commit()
