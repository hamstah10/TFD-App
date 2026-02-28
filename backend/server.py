from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Any
import uuid
from datetime import datetime
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# External Chiptuning API configuration
CHIPTUNING_API_BASE = "https://portal.tuningfiles-download.com/api/v1"
CHIPTUNING_API_KEY = "AWi1R04bkF0yi1v1p2HYk1lpADlUfmKOJyxdAol7txn8HblyYulAurFCdKO271cH"

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Blog Models
class BlogPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title_de: str
    title_en: str
    content_de: str
    content_en: str
    excerpt_de: str
    excerpt_en: str
    image_base64: Optional[str] = None
    author: str = "Admin"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published: bool = True

class BlogPostCreate(BaseModel):
    title_de: str
    title_en: str
    content_de: str
    content_en: str
    excerpt_de: str
    excerpt_en: str
    image_base64: Optional[str] = None
    author: str = "Admin"
    published: bool = True

class BlogPostUpdate(BaseModel):
    title_de: Optional[str] = None
    title_en: Optional[str] = None
    content_de: Optional[str] = None
    content_en: Optional[str] = None
    excerpt_de: Optional[str] = None
    excerpt_en: Optional[str] = None
    image_base64: Optional[str] = None
    author: Optional[str] = None
    published: Optional[bool] = None

# Contact Models
class ContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

class ContactMessageCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    message: str

# Opening Hours Model
class OpeningHours(BaseModel):
    monday: str = "08:00-18:00"
    tuesday: str = "08:00-18:00"
    wednesday: str = "08:00-18:00"
    thursday: str = "08:00-18:00"
    friday: str = "08:00-18:00"
    saturday: str = "09:00-13:00"
    sunday: str = "geschlossen"

# ============== HELPER FUNCTIONS ==============

async def fetch_chiptuning_api(endpoint: str) -> Any:
    """Fetch data from the external chiptuning API"""
    url = f"{CHIPTUNING_API_BASE}{endpoint}"
    headers = {
        "Authorization": f"Bearer {CHIPTUNING_API_KEY}",
        "Accept": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching {url}: {e.response.status_code}")
            raise HTTPException(status_code=e.response.status_code, detail=f"External API error: {e.response.text}")
        except httpx.RequestError as e:
            logger.error(f"Request error fetching {url}: {str(e)}")
            raise HTTPException(status_code=503, detail=f"External API unavailable: {str(e)}")

# ============== STATUS ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "Chiptuning Database API", "version": "1.0.0"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.model_dump())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# ============== CHIPTUNING API ROUTES ==============

@api_router.get("/chiptuning/types")
async def get_vehicle_types():
    """Get all vehicle types"""
    data = await fetch_chiptuning_api("/ad/types")
    return data

@api_router.get("/chiptuning/manufacturers/{type_id}")
async def get_manufacturers(type_id: str):
    """Get manufacturers for a vehicle type"""
    data = await fetch_chiptuning_api(f"/ad/{type_id}/manufacturers")
    return data

@api_router.get("/chiptuning/models/{manufacturer_id}")
async def get_models(manufacturer_id: str):
    """Get models for a manufacturer"""
    data = await fetch_chiptuning_api(f"/ad/{manufacturer_id}/models")
    return data

@api_router.get("/chiptuning/builts/{model_id}")
async def get_builts(model_id: str):
    """Get build versions for a model"""
    data = await fetch_chiptuning_api(f"/ad/{model_id}/builts")
    return data

@api_router.get("/chiptuning/engines/{built_id}")
async def get_engines(built_id: str):
    """Get engines for a build version"""
    data = await fetch_chiptuning_api(f"/ad/{built_id}/engines")
    return data

@api_router.get("/chiptuning/stages/{engine_id}")
async def get_stages(engine_id: str):
    """Get tuning stages for an engine"""
    data = await fetch_chiptuning_api(f"/ad/{engine_id}/stages")
    return data

# ============== BLOG ROUTES ==============

@api_router.post("/blog", response_model=BlogPost)
async def create_blog_post(post: BlogPostCreate):
    """Create a new blog post"""
    post_obj = BlogPost(**post.model_dump())
    await db.blog_posts.insert_one(post_obj.model_dump())
    return post_obj

@api_router.get("/blog", response_model=List[BlogPost])
async def get_blog_posts(published_only: bool = True):
    """Get all blog posts"""
    query = {"published": True} if published_only else {}
    posts = await db.blog_posts.find(query).sort("created_at", -1).to_list(100)
    return [BlogPost(**post) for post in posts]

@api_router.get("/blog/{post_id}", response_model=BlogPost)
async def get_blog_post(post_id: str):
    """Get a single blog post"""
    post = await db.blog_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return BlogPost(**post)

@api_router.put("/blog/{post_id}", response_model=BlogPost)
async def update_blog_post(post_id: str, update: BlogPostUpdate):
    """Update a blog post"""
    post = await db.blog_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.blog_posts.update_one({"id": post_id}, {"$set": update_data})
    updated_post = await db.blog_posts.find_one({"id": post_id})
    return BlogPost(**updated_post)

@api_router.delete("/blog/{post_id}")
async def delete_blog_post(post_id: str):
    """Delete a blog post"""
    result = await db.blog_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"message": "Blog post deleted successfully"}

# ============== CONTACT ROUTES ==============

@api_router.post("/contact", response_model=ContactMessage)
async def create_contact_message(message: ContactMessageCreate):
    """Submit a contact message"""
    message_obj = ContactMessage(**message.model_dump())
    await db.contact_messages.insert_one(message_obj.model_dump())
    return message_obj

@api_router.get("/contact", response_model=List[ContactMessage])
async def get_contact_messages():
    """Get all contact messages (admin)"""
    messages = await db.contact_messages.find().sort("created_at", -1).to_list(100)
    return [ContactMessage(**msg) for msg in messages]

@api_router.put("/contact/{message_id}/read")
async def mark_message_read(message_id: str):
    """Mark a contact message as read"""
    result = await db.contact_messages.update_one(
        {"id": message_id},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Message marked as read"}

@api_router.delete("/contact/{message_id}")
async def delete_contact_message(message_id: str):
    """Delete a contact message"""
    result = await db.contact_messages.delete_one({"id": message_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Message deleted successfully"}

# ============== OPENING HOURS ROUTES ==============

@api_router.get("/opening-hours", response_model=OpeningHours)
async def get_opening_hours():
    """Get opening hours"""
    hours = await db.opening_hours.find_one({})
    if not hours:
        # Return default opening hours
        default_hours = OpeningHours()
        await db.opening_hours.insert_one(default_hours.model_dump())
        return default_hours
    return OpeningHours(**hours)

@api_router.put("/opening-hours", response_model=OpeningHours)
async def update_opening_hours(hours: OpeningHours):
    """Update opening hours (admin)"""
    await db.opening_hours.delete_many({})
    await db.opening_hours.insert_one(hours.model_dump())
    return hours

# ============== COMPANY INFO ==============

@api_router.get("/company-info")
async def get_company_info():
    """Get company information"""
    return {
        "name": "Tuningfiles Download",
        "address": {
            "street": "Hauptstraße 231a",
            "city": "Suhl",
            "zip": "98529",
            "country": "Germany"
        },
        "phone": "+49 179 7511144",
        "email": "info@tuningfiles-download.com"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
