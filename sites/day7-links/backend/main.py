from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Dict
import re
import os
import logging
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="../.env")

# Get configuration from environment variables
SERVICE_DOMAIN = os.getenv("SERVICE_DOMAIN", "localhost:5000")
BACKEND_HOST = os.getenv("BACKEND_HOST", "localhost:5000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:4200")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create logs directory if it doesn't exist
os.makedirs("logs", exist_ok=True)

# Setup file handler for HTTP request logging
request_logger = logging.getLogger("http_requests")
request_handler = logging.FileHandler("logs/http_requests.log")
request_handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
request_logger.addHandler(request_handler)
request_logger.setLevel(logging.INFO)

app = FastAPI(title="Link Shortener Service", version="1.0.0")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    
    # Get request info
    client_ip = request.client.host if request.client else "unknown"
    method = request.method
    url = str(request.url)
    user_agent = request.headers.get("user-agent", "unknown")
    
    # Get request body for POST requests
    body = None
    if method in ["POST", "PUT", "PATCH"]:
        try:
            body_bytes = await request.body()
            if body_bytes:
                body = body_bytes.decode('utf-8')
        except Exception:
            body = "Could not read body"
    
    # Process the request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = (datetime.now() - start_time).total_seconds()
    
    # Log the request
    log_data = {
        "timestamp": start_time.isoformat(),
        "client_ip": client_ip,
        "method": method,
        "url": url,
        "user_agent": user_agent,
        "status_code": response.status_code,
        "process_time_seconds": round(process_time, 4)
    }
    
    if body:
        log_data["request_body"] = body
    
    request_logger.info(json.dumps(log_data))
    
    return response

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://127.0.0.1:4200"],  # Angular dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for URL mappings
# In production, this should be replaced with a proper database
url_mappings: Dict[str, str] = {}

# State persistence functions
STATE_FILE = "data/url_mappings.json"

def save_state():
    """Save the current URL mappings to a JSON file"""
    try:
        os.makedirs("data", exist_ok=True)
        with open(STATE_FILE, 'w') as f:
            json.dump(url_mappings, f, indent=2)
        logger.info(f"State saved to {STATE_FILE} with {len(url_mappings)} mappings")
    except Exception as e:
        logger.error(f"Failed to save state: {e}")

def load_state():
    """Load URL mappings from the JSON file"""
    global url_mappings
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, 'r') as f:
                loaded_mappings = json.load(f)
                url_mappings.update(loaded_mappings)
            logger.info(f"State loaded from {STATE_FILE} with {len(url_mappings)} mappings")
        else:
            logger.info("No existing state file found, starting with empty mappings")
    except Exception as e:
        logger.error(f"Failed to load state: {e}")
        logger.info("Starting with empty mappings")

# Load existing state on startup
load_state()

class URLRequest(BaseModel):
    long_url: HttpUrl
    short_path: str

    class Config:
        schema_extra = {
            "example": {
                "long_url": "https://www.example.com/very/long/url/path",
                "short_path": "example"
            }
        }

def validate_short_path(short_path: str) -> bool:
    """Validate that the short path contains only allowed characters"""
    # Allow alphanumeric characters, hyphens, and underscores
    pattern = r'^[a-zA-Z0-9_-]+$'
    return bool(re.match(pattern, short_path)) and len(short_path) > 0

@app.post("/shorten")
async def create_short_url(request: URLRequest):
    """
    Create a new short URL mapping.
    Returns 409 if the short path is already taken.
    """
    # Validate the short path format
    if not validate_short_path(request.short_path):
        raise HTTPException(
            status_code=400,
            detail="Short path can only contain alphanumeric characters, hyphens, and underscores"
        )
    
    # Check if short path already exists
    if request.short_path in url_mappings:
        raise HTTPException(
            status_code=409,
            detail=f"Short URL path '{request.short_path}' is already taken"
        )
    
    # Store the mapping
    url_mappings[request.short_path] = str(request.long_url)
    
    # Save state after adding new mapping
    save_state()
    
    return {
        "message": "Short URL created successfully",
        "short_url": f"{SERVICE_DOMAIN}/{request.short_path}",
        "long_url": str(request.long_url)
    }

@app.get("/{short_path}")
async def redirect_to_long_url(short_path: str):
    """
    Redirect to the long URL associated with the short path.
    Returns 302 redirect if found, 404 if not found.
    """
    if short_path not in url_mappings:
        raise HTTPException(
            status_code=404,
            detail=f"Short URL path '{short_path}' not found"
        )
    
    long_url = url_mappings[short_path]
    return RedirectResponse(url=long_url, status_code=302)

@app.get("/")
async def root():
    """Root endpoint with basic information"""
    return {
        "message": "Link Shortener Service",
        "usage": {
            "create_short_url": "POST /shorten with JSON body containing 'long_url' and 'short_path'",
            "redirect": "GET /{short_path} to redirect to the long URL"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
