import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./orveyra.db")
# Convert relative path if needed
if DB_PATH.startswith("sqlite:///./"):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_file = os.path.join(base_dir, DB_PATH.replace("sqlite:///./", ""))
    DB_PATH = f"sqlite:///{db_file}"

engine = create_engine(
    DB_PATH, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
