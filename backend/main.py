import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine
from app.models.models import Base
from app.api import auth, users, posts, messages, notifications, communities

# Create all tables on startup
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[*] Connectly API starting up...")
    # Optional: Check for RabbitMQ / Redis availability
    try:
        import redis as redis_lib
        r = redis_lib.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        r.ping()
        print("[OK] Redis connected")
    except Exception:
        print("[INFO] Redis not available -- caching disabled.")

    try:
        import aio_pika
        # Just validate URL is parseable
        print(f"[INFO] RabbitMQ URL configured: {settings.RABBITMQ_URL}")
    except Exception:
        pass

    yield
    print("[*] Connectly API shutting down...")


app = FastAPI(
    title="Connectly API",
    description="Backend API for Connectly — Social Networking & Messaging Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (uploaded media)
upload_path = os.path.abspath(settings.UPLOAD_DIR)
os.makedirs(upload_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_path), name="uploads")

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(posts.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(communities.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Connectly API"}
