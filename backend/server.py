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
from datetime import datetime, timezone
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
USE_MOCK_DATA = False  # Live API is now active!

# Fahrzeugschein Scanner API configuration
FAHRZEUGSCHEIN_API_BASE = "https://api.fahrzeugschein-scanner.de"
FAHRZEUGSCHEIN_ACCESS_KEY = "361dc9e0-2bb6-4471-a690-7f0d8b973a10"

# CRM API configuration for customer authentication
CRM_API_BASE = "https://verwaltung.tuningfux.de/api"

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

# ============== MOCK DATA ==============

MOCK_VEHICLE_TYPES = [
    {"id": "type_pkw", "name": "PKW"},
    {"id": "type_lkw", "name": "LKW"},
    {"id": "type_agrar", "name": "Agrar"},
    {"id": "type_motorrad", "name": "Motorrad"},
    {"id": "type_jetski", "name": "JetSki"},
    {"id": "type_andere", "name": "Andere"}
]

MOCK_MANUFACTURERS = {
    "type_pkw": [
        {"id": "manu_audi", "name": "Audi"},
        {"id": "manu_bmw", "name": "BMW"},
        {"id": "manu_mercedes", "name": "Mercedes-Benz"},
        {"id": "manu_vw", "name": "Volkswagen"},
        {"id": "manu_porsche", "name": "Porsche"},
        {"id": "manu_ford", "name": "Ford"},
        {"id": "manu_opel", "name": "Opel"}
    ],
    "type_lkw": [
        {"id": "manu_man", "name": "MAN"},
        {"id": "manu_scania", "name": "Scania"},
        {"id": "manu_volvo", "name": "Volvo"},
        {"id": "manu_daf", "name": "DAF"}
    ],
    "type_agrar": [
        {"id": "manu_johndeere", "name": "John Deere"},
        {"id": "manu_fendt", "name": "Fendt"},
        {"id": "manu_claas", "name": "Claas"}
    ],
    "type_motorrad": [
        {"id": "manu_honda", "name": "Honda"},
        {"id": "manu_yamaha", "name": "Yamaha"},
        {"id": "manu_kawasaki", "name": "Kawasaki"},
        {"id": "manu_ducati", "name": "Ducati"}
    ],
    "type_jetski": [
        {"id": "manu_seadoo", "name": "Sea-Doo"},
        {"id": "manu_yamahawc", "name": "Yamaha WaveRunner"}
    ],
    "type_andere": [
        {"id": "manu_other", "name": "Sonstige"}
    ]
}

MOCK_MODELS = {
    "manu_audi": [
        {"id": "model_a3", "name": "A3"},
        {"id": "model_a4", "name": "A4"},
        {"id": "model_a6", "name": "A6"},
        {"id": "model_q5", "name": "Q5"},
        {"id": "model_q7", "name": "Q7"},
        {"id": "model_rs6", "name": "RS6"}
    ],
    "manu_bmw": [
        {"id": "model_3er", "name": "3er Serie"},
        {"id": "model_5er", "name": "5er Serie"},
        {"id": "model_x3", "name": "X3"},
        {"id": "model_x5", "name": "X5"},
        {"id": "model_m3", "name": "M3"}
    ],
    "manu_mercedes": [
        {"id": "model_cclass", "name": "C-Klasse"},
        {"id": "model_eclass", "name": "E-Klasse"},
        {"id": "model_sclass", "name": "S-Klasse"},
        {"id": "model_glc", "name": "GLC"},
        {"id": "model_amggt", "name": "AMG GT"}
    ],
    "manu_vw": [
        {"id": "model_golf", "name": "Golf"},
        {"id": "model_passat", "name": "Passat"},
        {"id": "model_tiguan", "name": "Tiguan"},
        {"id": "model_arteon", "name": "Arteon"}
    ],
    "manu_porsche": [
        {"id": "model_911", "name": "911"},
        {"id": "model_cayenne", "name": "Cayenne"},
        {"id": "model_macan", "name": "Macan"},
        {"id": "model_panamera", "name": "Panamera"}
    ]
}

MOCK_BUILTS = {
    "model_a4": [
        {"id": "built_a4_2020", "name": "2020-2024 (B9 Facelift)"},
        {"id": "built_a4_2016", "name": "2016-2019 (B9)"},
        {"id": "built_a4_2012", "name": "2012-2015 (B8)"}
    ],
    "model_golf": [
        {"id": "built_golf8", "name": "2020-2024 (Golf 8)"},
        {"id": "built_golf7", "name": "2012-2019 (Golf 7)"},
        {"id": "built_golf6", "name": "2008-2012 (Golf 6)"}
    ],
    "model_3er": [
        {"id": "built_g20", "name": "2019-2024 (G20)"},
        {"id": "built_f30", "name": "2012-2018 (F30)"}
    ],
    "model_cclass": [
        {"id": "built_w206", "name": "2021-2024 (W206)"},
        {"id": "built_w205", "name": "2014-2020 (W205)"}
    ]
}

MOCK_ENGINES = {
    "built_a4_2020": [
        {"id": "eng_a4_20tdi", "name": "2.0 TDI 150 PS"},
        {"id": "eng_a4_20tfsi", "name": "2.0 TFSI 190 PS"},
        {"id": "eng_a4_35tfsi", "name": "35 TFSI 150 PS"},
        {"id": "eng_a4_45tfsi", "name": "45 TFSI 245 PS"}
    ],
    "built_golf8": [
        {"id": "eng_golf_10tsi", "name": "1.0 TSI 110 PS"},
        {"id": "eng_golf_15tsi", "name": "1.5 TSI 150 PS"},
        {"id": "eng_golf_20tdi", "name": "2.0 TDI 150 PS"},
        {"id": "eng_golf_gti", "name": "GTI 2.0 TSI 245 PS"}
    ],
    "built_g20": [
        {"id": "eng_320i", "name": "320i 184 PS"},
        {"id": "eng_330i", "name": "330i 258 PS"},
        {"id": "eng_320d", "name": "320d 190 PS"},
        {"id": "eng_m340i", "name": "M340i 374 PS"}
    ]
}

MOCK_STAGES = {
    "eng_a4_20tfsi": [
        {
            "id": "stage_eco",
            "name": "Eco Tuning",
            "description_de": "Kraftstoffverbrauch optimieren",
            "description_en": "Optimize fuel consumption",
            "original_power": "190 PS",
            "tuned_power": "190 PS",
            "original_torque": "320 Nm",
            "tuned_torque": "340 Nm",
            "price": 299
        },
        {
            "id": "stage_1",
            "name": "Stage 1",
            "description_de": "Leistungssteigerung ohne Hardwareänderungen",
            "description_en": "Performance increase without hardware changes",
            "original_power": "190 PS",
            "tuned_power": "240 PS",
            "original_torque": "320 Nm",
            "tuned_torque": "400 Nm",
            "price": 499
        },
        {
            "id": "stage_2",
            "name": "Stage 2",
            "description_de": "Mit Sport-Luftfilter und Downpipe",
            "description_en": "With sport air filter and downpipe",
            "original_power": "190 PS",
            "tuned_power": "280 PS",
            "original_torque": "320 Nm",
            "tuned_torque": "450 Nm",
            "price": 699
        }
    ],
    "eng_golf_gti": [
        {
            "id": "stage_1_gti",
            "name": "Stage 1",
            "description_de": "Software-Optimierung für mehr Leistung",
            "description_en": "Software optimization for more power",
            "original_power": "245 PS",
            "tuned_power": "300 PS",
            "original_torque": "370 Nm",
            "tuned_torque": "440 Nm",
            "price": 599
        },
        {
            "id": "stage_2_gti",
            "name": "Stage 2+",
            "description_de": "Mit Turbo-Upgrade und Ladeluftkühler",
            "description_en": "With turbo upgrade and intercooler",
            "original_power": "245 PS",
            "tuned_power": "350 PS",
            "original_torque": "370 Nm",
            "tuned_torque": "500 Nm",
            "price": 899
        }
    ],
    "eng_m340i": [
        {
            "id": "stage_1_m340",
            "name": "Stage 1",
            "description_de": "ECU Tuning für maximale Leistung",
            "description_en": "ECU tuning for maximum performance",
            "original_power": "374 PS",
            "tuned_power": "420 PS",
            "original_torque": "500 Nm",
            "tuned_torque": "580 Nm",
            "price": 799
        }
    ]
}

# Default stages for engines without specific data
DEFAULT_STAGES = [
    {
        "id": "stage_eco_default",
        "name": "Eco Tuning",
        "description_de": "Kraftstoffverbrauch optimieren",
        "description_en": "Optimize fuel consumption",
        "original_power": "Standard",
        "tuned_power": "Standard",
        "original_torque": "Standard",
        "tuned_torque": "+5%",
        "price": 249
    },
    {
        "id": "stage_1_default",
        "name": "Stage 1",
        "description_de": "Leistungssteigerung ohne Hardwareänderungen",
        "description_en": "Performance increase without hardware changes",
        "original_power": "Standard",
        "tuned_power": "+15-25%",
        "original_torque": "Standard",
        "tuned_torque": "+20-30%",
        "price": 449
    }
]

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
    monday: str = "05:00-18:00"
    tuesday: str = "05:00-18:00"
    wednesday: str = "05:00-18:00"
    thursday: str = "05:00-18:00"
    friday: str = "05:00-18:00"
    saturday: str = "05:00-13:00"
    sunday: str = "geschlossen"

# Auth Models for CRM API
class LoginRequest(BaseModel):
    email: str
    password: str
    deviceName: str = "tuningfiles-app"

class RefreshTokenRequest(BaseModel):
    refreshToken: str

# Order Models
class OrderCreate(BaseModel):
    fileName: str
    fileData: str  # Base64 encoded file
    fileSize: int
    tuningTool: str
    method: str
    slaveOrMaster: str
    vehicleType: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    built: Optional[str] = None
    engine: Optional[str] = None
    stage: Optional[str] = None
    vehicleDisplay: Optional[str] = None  # Formatted vehicle string for display

class OrderResponse(BaseModel):
    id: str
    orderNumber: str
    customerId: int
    createdAt: str
    status: str
    fileName: str
    vehicle: str
    stage: str
    tuningTool: str
    method: str
    slaveOrMaster: str

# ============== HELPER FUNCTIONS ==============

async def verify_token_and_get_customer(authorization: str) -> dict:
    """Verify token with CRM API and return customer data"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header fehlt oder ungültig")
    
    url = f"{CRM_API_BASE}/auth/me"
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        try:
            response = await http_client.get(url, headers={"Authorization": authorization})
            if response.status_code == 200:
                result = response.json()
                logger.info(f"CRM /auth/me response: {result}")
                # CRM API returns data in a "customer" wrapper
                if "customer" in result:
                    return result["customer"]
                # Fallback for "data" wrapper
                if "data" in result:
                    return result["data"]
                return result
            else:
                raise HTTPException(status_code=401, detail="Token ungültig oder abgelaufen")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="CRM API nicht erreichbar")

async def get_public_ip() -> str:
    """Get the server's public IP address"""
    async with httpx.AsyncClient(timeout=10.0) as http_client:
        try:
            response = await http_client.get("https://ifconfig.me/ip")
            ip = response.text.strip()
            # Validate it's a proper IP format
            if ip and '.' in ip and not '<' in ip:
                return ip
            else:
                return "35.225.230.28"  # Fallback IP
        except:
            return "35.225.230.28"  # Fallback IP

async def fetch_chiptuning_api(endpoint: str, mdt_id: str = None) -> Any:
    """Fetch data from the external chiptuning API"""
    url = f"{CHIPTUNING_API_BASE}{endpoint}"
    public_ip = await get_public_ip()
    headers = {
        "Authorization": f"Bearer {CHIPTUNING_API_KEY}",
        "IP": public_ip,
        "Accept": "application/json"
    }
    
    # Add MdtId header if provided (needed for models and subsequent endpoints)
    if mdt_id:
        headers["MdtId"] = mdt_id
    
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as http_client:
        try:
            response = await http_client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching {url}: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail=f"External API error: {e.response.text}")
        except httpx.RequestError as e:
            logger.error(f"Request error fetching {url}: {str(e)}")
            raise HTTPException(status_code=503, detail=f"External API unavailable: {str(e)}")

# ============== STATUS ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "Chiptuning Database API", "version": "1.0.0", "mock_data": USE_MOCK_DATA}

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
    if USE_MOCK_DATA:
        return {"status": True, "data": MOCK_VEHICLE_TYPES}
    result = await fetch_chiptuning_api("/ad/types")
    # Transform to unified format with ulid as id, include mdt_id for subsequent calls
    if result.get("status") and result.get("vehicleTypes"):
        data = [{"id": t["ulid"], "name": t.get("name_de", t["name"]), "image": t.get("image_path"), "mdt_id": str(t.get("mdt_id", ""))} for t in result["vehicleTypes"]]
        return {"status": True, "data": data}
    return result

@api_router.get("/chiptuning/manufacturers/{type_id}")
async def get_manufacturers(type_id: str, mdt_id: str = None):
    """Get manufacturers for a vehicle type (use ULID)"""
    if USE_MOCK_DATA:
        manufacturers = MOCK_MANUFACTURERS.get(type_id, [])
        return {"status": True, "data": manufacturers}
    result = await fetch_chiptuning_api(f"/ad/{type_id}/manufacturers", mdt_id=mdt_id)
    # Transform to unified format
    if result.get("status") and result.get("manufacturers"):
        data = [{"id": m["ulid"], "name": m["name"], "image": m.get("image_path")} for m in result["manufacturers"]]
        return {"status": True, "data": data}
    return result

@api_router.get("/chiptuning/models/{manufacturer_id}")
async def get_models(manufacturer_id: str, mdt_id: str = None):
    """Get models for a manufacturer (use ULID). Requires mdt_id from vehicle type."""
    if USE_MOCK_DATA:
        models = MOCK_MODELS.get(manufacturer_id, [{"id": "model_default", "name": "Standard Model"}])
        return {"status": True, "data": models}
    
    result = await fetch_chiptuning_api(f"/ad/{manufacturer_id}/models", mdt_id=mdt_id)
    # Transform to unified format
    if result.get("status") and result.get("models"):
        data = [{"id": m["ulid"], "name": m["name"]} for m in result["models"]]
        return {"status": True, "data": data}
    return result

@api_router.get("/chiptuning/builts/{model_id}")
async def get_builts(model_id: str, mdt_id: str = None):
    """Get build versions for a model (use ULID)"""
    if USE_MOCK_DATA:
        builts = MOCK_BUILTS.get(model_id, [{"id": f"built_{model_id}_default", "name": "2020-2024"}])
        return {"status": True, "data": builts}
    result = await fetch_chiptuning_api(f"/ad/{model_id}/builts", mdt_id=mdt_id)
    # Transform to unified format
    if result.get("status") and result.get("builts"):
        data = [{"id": b["ulid"], "name": b["name"]} for b in result["builts"]]
        return {"status": True, "data": data}
    return result

@api_router.get("/chiptuning/engines/{built_id}")
async def get_engines(built_id: str, mdt_id: str = None):
    """Get engines for a build version (use ULID)"""
    if USE_MOCK_DATA:
        engines = MOCK_ENGINES.get(built_id, [{"id": f"eng_{built_id}_default", "name": "2.0 TDI 150 PS"}])
        return {"status": True, "data": engines}
    result = await fetch_chiptuning_api(f"/ad/{built_id}/engines", mdt_id=mdt_id)
    # Transform to unified format
    if result.get("status") and result.get("engines"):
        data = [{"id": e["ulid"], "name": e["name"]} for e in result["engines"]]
        return {"status": True, "data": data}
    return result

@api_router.get("/chiptuning/stages/{engine_id}")
async def get_stages(engine_id: str, mdt_id: str = None):
    """Get tuning stages for an engine (use ULID)"""
    if USE_MOCK_DATA:
        stages = MOCK_STAGES.get(engine_id, DEFAULT_STAGES)
        return {"status": True, "data": stages}
    result = await fetch_chiptuning_api(f"/ad/{engine_id}/stages", mdt_id=mdt_id)
    # Transform to unified format with table_data
    if result.get("status") and result.get("stages"):
        data = []
        for s in result["stages"]:
            table_data = s.get("table_data", {})
            data.append({
                "id": s.get("ulid", s.get("id")),
                "name": s.get("name"),
                "org_hp": table_data.get("org_hp", s.get("org_hp", 0)),
                "org_tq": table_data.get("org_tq", s.get("org_tq", 0)),
                "tun_hp": table_data.get("tun_hp", 0),
                "tun_tq": table_data.get("tun_tq", 0),
                "delta_hp": table_data.get("delta_hp_abs", 0),
                "delta_tq": table_data.get("delta_tq_abs", 0),
                "delta_hp_percent": table_data.get("delta_hp_per", 0),
                "delta_tq_percent": table_data.get("delta_tq_per", 0),
                "price": table_data.get("price", s.get("price", 0))
            })
        return {"status": True, "data": data}
    return result

# New endpoints for ECUs and Options
@api_router.get("/chiptuning/ecus/{engine_id}")
async def get_ecus(engine_id: str, mdt_id: str = None):
    """Get ECUs for an engine (use ULID)"""
    result = await fetch_chiptuning_api(f"/ad/{engine_id}/ecus", mdt_id=mdt_id)
    if result.get("status") and result.get("ecus"):
        data = [{"id": e["ulid"], "name": e["name"]} for e in result["ecus"]]
        return {"status": True, "data": data}
    return result

@api_router.get("/chiptuning/options/{engine_id}/{ecu_id}")
async def get_options(engine_id: str, ecu_id: str, mdt_id: str = None):
    """Get options for an engine and ECU combination (use ULIDs)"""
    result = await fetch_chiptuning_api(f"/ad/engines/{engine_id}/ecus/{ecu_id}/options", mdt_id=mdt_id)
    # API returns 'vehicle_options' not 'options'
    if result.get("status") and result.get("vehicle_options"):
        data = []
        for opt in result["vehicle_options"]:
            data.append({
                "id": opt.get("id"),
                "name": opt.get("name"),
                "image": opt.get("image"),
                "tooltip": opt.get("tooltip"),
                "description": opt.get("description")
            })
        return {"status": True, "data": data}
    return result

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

# ============== CHAT ASSISTANT ROUTES ==============

# Get available vehicle data for the AI assistant
def get_vehicle_data_context():
    """Build context about available vehicles for the AI"""
    context = "Verfügbare Fahrzeuge in unserer Datenbank:\n\n"
    
    context += "FAHRZEUGTYPEN:\n"
    for vtype in MOCK_VEHICLE_TYPES:
        context += f"- {vtype['name']}\n"
    
    context += "\nPKW HERSTELLER:\n"
    for manu in MOCK_MANUFACTURERS.get("type_pkw", []):
        context += f"- {manu['name']}\n"
    
    context += "\nVerfügbare PKW Modelle:\n"
    for manu_id, models in MOCK_MODELS.items():
        manu_name = next((m['name'] for m in MOCK_MANUFACTURERS.get("type_pkw", []) if m['id'] == manu_id), manu_id)
        context += f"\n{manu_name}:\n"
        for model in models:
            context += f"  - {model['name']}\n"
    
    context += "\nVerfügbare Baujahre/Versionen:\n"
    for model_id, builts in MOCK_BUILTS.items():
        model_name = None
        for models in MOCK_MODELS.values():
            for m in models:
                if m['id'] == model_id:
                    model_name = m['name']
                    break
        if model_name:
            context += f"\n{model_name}:\n"
            for built in builts:
                context += f"  - {built['name']}\n"
    
    return context

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: str = "de"

class ChatResponse(BaseModel):
    response: str
    vehicle_suggestion: Optional[dict] = None
    session_id: str

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(chat_input: ChatMessage):
    """Chat with the AI assistant to find the right vehicle configuration"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    session_id = chat_input.session_id or str(uuid.uuid4())
    
    # Get or create chat history from database
    chat_history = await db.chat_sessions.find_one({"session_id": session_id})
    
    vehicle_context = get_vehicle_data_context()
    
    system_message = f"""Du bist ein freundlicher Chiptuning-Berater für TuningFiles-Download.com.
Deine Aufgabe ist es, Kunden bei der Auswahl des richtigen Fahrzeugs und der passenden Tuning-Stufe zu helfen.

{vehicle_context}

TUNING-STUFEN:
- Eco Tuning: Kraftstoffverbrauch optimieren, gleiche Leistung
- Stage 1: Software-Optimierung ohne Hardware-Änderungen (+15-25% Leistung)
- Stage 2: Mit Hardware-Upgrades wie Downpipe, Luftfilter (+25-40% Leistung)
- Stage 2+: Maximale Leistung mit Turbo-Upgrade

WICHTIGE REGELN:
1. Frage nach dem Fahrzeug des Kunden (Marke, Modell, Baujahr, Motor)
2. Wenn du genug Information hast, gib eine JSON-Empfehlung mit den IDs zurück
3. Sei freundlich und hilfsbereit
4. Antworte in der Sprache des Kunden ({chat_input.language})
5. Wenn du eine Fahrzeugempfehlung hast, füge am Ende deiner Antwort einen JSON-Block ein:
   [VEHICLE_SUGGESTION]
   {{"type_id": "...", "manufacturer_id": "...", "model_id": "...", "built_id": "...", "engine_id": "..."}}
   [/VEHICLE_SUGGESTION]

Nur wenn du alle nötigen IDs hast, füge den JSON-Block ein. Sonst frage weiter nach Details."""

    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        # Load previous messages from database if exists
        if chat_history and 'messages' in chat_history:
            for msg in chat_history['messages']:
                if msg['role'] == 'user':
                    await chat.send_message(UserMessage(text=msg['content']))
        
        # Send new message
        user_message = UserMessage(text=chat_input.message)
        response_text = await chat.send_message(user_message)
        
        # Extract vehicle suggestion if present
        vehicle_suggestion = None
        if "[VEHICLE_SUGGESTION]" in response_text and "[/VEHICLE_SUGGESTION]" in response_text:
            import json
            start = response_text.find("[VEHICLE_SUGGESTION]") + len("[VEHICLE_SUGGESTION]")
            end = response_text.find("[/VEHICLE_SUGGESTION]")
            try:
                suggestion_json = response_text[start:end].strip()
                vehicle_suggestion = json.loads(suggestion_json)
                # Remove the suggestion block from the response
                response_text = response_text[:response_text.find("[VEHICLE_SUGGESTION]")].strip()
            except json.JSONDecodeError:
                pass
        
        # Save chat history to database
        new_messages = []
        if chat_history and 'messages' in chat_history:
            new_messages = chat_history['messages']
        new_messages.append({"role": "user", "content": chat_input.message})
        new_messages.append({"role": "assistant", "content": response_text})
        
        await db.chat_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"messages": new_messages, "updated_at": datetime.utcnow()}},
            upsert=True
        )
        
        return ChatResponse(
            response=response_text,
            vehicle_suggestion=vehicle_suggestion,
            session_id=session_id
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@api_router.delete("/chat/{session_id}")
async def clear_chat_session(session_id: str):
    """Clear chat history for a session"""
    await db.chat_sessions.delete_one({"session_id": session_id})
    return {"message": "Chat session cleared"}

# ============== CUSTOMER PHOTOS ROUTES ==============

class CustomerPhoto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    base64: str
    filename: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CustomerPhotoCreate(BaseModel):
    user_id: str
    base64: str
    filename: Optional[str] = None
    description: Optional[str] = None

@api_router.post("/photos", response_model=CustomerPhoto)
async def create_photo(photo: CustomerPhotoCreate):
    """Save a customer photo"""
    photo_obj = CustomerPhoto(**photo.model_dump())
    await db.customer_photos.insert_one(photo_obj.model_dump())
    return photo_obj

@api_router.get("/photos/{user_id}", response_model=List[CustomerPhoto])
async def get_user_photos(user_id: str):
    """Get all photos for a user"""
    photos = await db.customer_photos.find({"user_id": user_id}).sort("created_at", -1).to_list(100)
    return [CustomerPhoto(**photo) for photo in photos]

@api_router.delete("/photos/{photo_id}")
async def delete_photo(photo_id: str):
    """Delete a photo"""
    result = await db.customer_photos.delete_one({"id": photo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found")
    return {"message": "Photo deleted successfully"}

# ============== FAHRZEUGSCHEIN SCANNER ROUTES ==============

class FahrzeugscheinScanRequest(BaseModel):
    image: str  # Base64 encoded image
    show_cuts: bool = False

class FahrzeugscheinScanResponse(BaseModel):
    success: bool
    country_code: Optional[str] = None
    data: Optional[dict] = None
    error: Optional[str] = None

@api_router.post("/scan-fahrzeugschein", response_model=FahrzeugscheinScanResponse)
async def scan_fahrzeugschein(request: FahrzeugscheinScanRequest):
    """Scan a vehicle registration document (Fahrzeugschein) and extract data"""
    url = f"{FAHRZEUGSCHEIN_API_BASE}/generic-json"
    headers = {
        "Content-Type": "application/json",
        "access_key": FAHRZEUGSCHEIN_ACCESS_KEY
    }
    
    payload = {
        "image": request.image,
        "show_cuts": request.show_cuts
    }
    
    async with httpx.AsyncClient(timeout=60.0) as http_client:
        try:
            response = await http_client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            return FahrzeugscheinScanResponse(
                success=True,
                country_code=result.get("country_code"),
                data=result.get("data")
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"Fahrzeugschein API HTTP error: {e.response.status_code} - {e.response.text}")
            error_detail = "API Fehler"
            try:
                error_json = e.response.json()
                error_detail = error_json.get("message", str(e.response.status_code))
            except:
                error_detail = f"HTTP {e.response.status_code}"
            return FahrzeugscheinScanResponse(
                success=False,
                error=error_detail
            )
        except httpx.RequestError as e:
            logger.error(f"Fahrzeugschein API request error: {str(e)}")
            return FahrzeugscheinScanResponse(
                success=False,
                error=f"Verbindungsfehler: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Fahrzeugschein scan error: {str(e)}")
            return FahrzeugscheinScanResponse(
                success=False,
                error=f"Unbekannter Fehler: {str(e)}"
            )

# ============== AUTH ROUTES (CRM API Proxy) ==============

from fastapi import Request, Header

@api_router.post("/auth/login")
async def login(login_request: LoginRequest):
    """Proxy login request to CRM API"""
    url = f"{CRM_API_BASE}/auth/login"
    
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        try:
            response = await http_client.post(
                url,
                json={
                    "email": login_request.email,
                    "password": login_request.password,
                    "deviceName": login_request.deviceName
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Ungültige Anmeldedaten")
            elif response.status_code == 422:
                raise HTTPException(status_code=422, detail="Pflichtfelder fehlen")
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
        except httpx.RequestError as e:
            logger.error(f"CRM API request error: {str(e)}")
            raise HTTPException(status_code=503, detail="CRM API nicht erreichbar")

@api_router.post("/auth/refresh")
async def refresh_token(refresh_request: RefreshTokenRequest):
    """Proxy refresh token request to CRM API"""
    url = f"{CRM_API_BASE}/auth/refresh"
    
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        try:
            response = await http_client.post(
                url,
                json={"refreshToken": refresh_request.refreshToken},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Token ungültig oder abgelaufen")
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
        except httpx.RequestError as e:
            logger.error(f"CRM API request error: {str(e)}")
            raise HTTPException(status_code=503, detail="CRM API nicht erreichbar")

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Proxy get current user request to CRM API"""
    url = f"{CRM_API_BASE}/auth/me"
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header fehlt")
    
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        try:
            response = await http_client.get(
                url,
                headers={"Authorization": auth_header}
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Token ungültig oder abgelaufen")
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
        except httpx.RequestError as e:
            logger.error(f"CRM API request error: {str(e)}")
            raise HTTPException(status_code=503, detail="CRM API nicht erreichbar")

@api_router.post("/auth/logout")
async def logout(request: Request):
    """Proxy logout request to CRM API"""
    url = f"{CRM_API_BASE}/auth/logout"
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header fehlt")
    
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        try:
            response = await http_client.post(
                url,
                headers={"Authorization": auth_header}
            )
            
            if response.status_code == 204:
                return {"message": "Erfolgreich abgemeldet"}
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Token ungültig")
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
        except httpx.RequestError as e:
            logger.error(f"CRM API request error: {str(e)}")
            raise HTTPException(status_code=503, detail="CRM API nicht erreichbar")

# ============== ORDER ROUTES (User-specific) ==============

@api_router.post("/orders")
async def create_order(order: OrderCreate, request: Request):
    """Create a new order for the authenticated user and forward to CRM"""
    auth_header = request.headers.get("Authorization")
    logger.info(f"POST /orders - Authorization header present: {bool(auth_header)}")
    if auth_header:
        logger.info(f"POST /orders - Auth header format: {auth_header[:30]}..." if len(auth_header) > 30 else f"POST /orders - Auth header: {auth_header}")
    else:
        logger.error("POST /orders - No Authorization header received!")
    
    customer = await verify_token_and_get_customer(auth_header)
    customer_id = customer.get("id")
    logger.info(f"POST /orders - Customer ID: {customer_id}, Email: {customer.get('email')}")
    
    if not customer_id:
        raise HTTPException(status_code=401, detail="Kunde nicht gefunden")
    
    # Generate order number
    order_count = await db.orders.count_documents({"customerId": customer_id})
    order_number = f"TFD-{customer_id}-{order_count + 1:04d}"
    
    created_at = datetime.now(timezone.utc).isoformat()
    
    # Create order document for local storage
    order_doc = {
        "orderNumber": order_number,
        "customerId": customer_id,
        "customerEmail": customer.get("email"),
        "companyName": customer.get("companyName"),
        "createdAt": created_at,
        "status": "pending",
        "fileName": order.fileName,
        "fileSize": order.fileSize,
        "fileData": order.fileData,  # Base64 encoded file
        "vehicle": order.vehicleDisplay or "Unbekannt",
        "vehicleType": order.vehicleType,
        "manufacturer": order.manufacturer,
        "model": order.model,
        "built": order.built,
        "engine": order.engine,
        "stage": order.stage or "Nicht angegeben",
        "tuningTool": order.tuningTool,
        "method": order.method,
        "slaveOrMaster": order.slaveOrMaster,
    }
    
    # Forward order to CRM API
    crm_order_payload = {
        "customerId": int(customer_id),  # Ensure it's an integer
        "customerEmail": customer.get("email"),
        "fileName": order.fileName,
        "fileData": order.fileData,
        "fileSize": int(order.fileSize),  # Ensure it's an integer
        "vehicleType": order.vehicleType,
        "manufacturer": order.manufacturer,
        "model": order.model,
        "built": order.built,
        "engine": order.engine,
        "vehicleDisplay": order.vehicleDisplay or "Unbekannt",
        "tuningTool": order.tuningTool,
        "method": order.method,
        "slaveOrMaster": order.slaveOrMaster,
        "stage": order.stage,
        "createdAt": created_at,
        "deviceName": "tuningfiles-app",
    }
    
    crm_order_id = None
    crm_error = None
    
    try:
        logger.info(f"Forwarding order to CRM: {CRM_API_BASE}/orders")
        logger.info(f"CRM payload customerId: {crm_order_payload.get('customerId')}, fileName: {crm_order_payload.get('fileName')}")
        
        async with httpx.AsyncClient(timeout=60.0) as http_client:
            crm_response = await http_client.post(
                f"{CRM_API_BASE}/orders",
                json=crm_order_payload,
                headers={
                    "Authorization": auth_header,
                    "Content-Type": "application/json"
                }
            )
            
            logger.info(f"CRM response status: {crm_response.status_code}")
            
            if crm_response.status_code in [200, 201]:
                crm_data = crm_response.json()
                crm_order_id = crm_data.get("id") or crm_data.get("orderId")
                order_doc["crmOrderId"] = crm_order_id
                order_doc["crmSynced"] = True
                logger.info(f"Order successfully sent to CRM: {crm_order_id}")
            else:
                crm_error = f"CRM API returned {crm_response.status_code}: {crm_response.text}"
                order_doc["crmSynced"] = False
                order_doc["crmError"] = crm_error
                logger.error(f"CRM API error: {crm_error}")
                
    except httpx.RequestError as e:
        crm_error = f"CRM API request failed: {str(e)}"
        order_doc["crmSynced"] = False
        order_doc["crmError"] = crm_error
        logger.error(crm_error)
    
    # Save to local database
    result = await db.orders.insert_one(order_doc)
    order_doc["id"] = str(result.inserted_id)
    
    # Remove _id and fileData from response
    order_doc.pop("_id", None)
    order_doc.pop("fileData", None)
    
    # Add CRM sync status to response
    if crm_order_id:
        order_doc["crmOrderId"] = crm_order_id
    
    return order_doc

@api_router.get("/orders")
async def get_orders(request: Request):
    """Get all orders for the authenticated user"""
    auth_header = request.headers.get("Authorization")
    customer = await verify_token_and_get_customer(auth_header)
    customer_id = customer.get("id")
    
    cursor = db.orders.find(
        {"customerId": customer_id},
        {"fileData": 0, "_id": 0}  # Exclude file data and _id from response
    ).sort("createdAt", -1)
    
    orders = await cursor.to_list(length=100)
    
    # Add id field from MongoDB _id
    for order in orders:
        if "_id" in order:
            order["id"] = str(order["_id"])
            del order["_id"]
    
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    """Get a specific order for the authenticated user"""
    auth_header = request.headers.get("Authorization")
    customer = await verify_token_and_get_customer(auth_header)
    customer_id = customer.get("id")
    
    order = await db.orders.find_one(
        {"orderNumber": order_id, "customerId": customer_id},
        {"fileData": 0}  # Exclude file data from response
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Auftrag nicht gefunden")
    
    order["id"] = str(order["_id"])
    del order["_id"]
    
    return order

# ============== PHOTOS ROUTES (User-specific, updated) ==============

@api_router.post("/customer/photos")
async def save_customer_photo(request: Request):
    """Save a photo for the authenticated user"""
    auth_header = request.headers.get("Authorization")
    customer = await verify_token_and_get_customer(auth_header)
    customer_id = customer.get("id")
    
    body = await request.json()
    base64_data = body.get("base64")
    filename = body.get("filename", "photo.jpg")
    description = body.get("description", "")
    
    if not base64_data:
        raise HTTPException(status_code=400, detail="Keine Bilddaten")
    
    photo_doc = {
        "customerId": customer_id,
        "customerEmail": customer.get("email"),
        "base64": base64_data,
        "filename": filename,
        "description": description,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    
    result = await db.customer_photos.insert_one(photo_doc)
    
    return {
        "id": str(result.inserted_id),
        "filename": filename,
        "description": description,
        "createdAt": photo_doc["createdAt"],
    }

@api_router.get("/customer/photos")
async def get_customer_photos(request: Request):
    """Get all photos for the authenticated user"""
    auth_header = request.headers.get("Authorization")
    customer = await verify_token_and_get_customer(auth_header)
    customer_id = customer.get("id")
    
    cursor = db.customer_photos.find(
        {"customerId": customer_id},
        {"_id": 1, "filename": 1, "description": 1, "createdAt": 1, "base64": 1}
    ).sort("createdAt", -1)
    
    photos = await cursor.to_list(length=100)
    
    for photo in photos:
        photo["id"] = str(photo["_id"])
        del photo["_id"]
    
    return photos

@api_router.delete("/customer/photos/{photo_id}")
async def delete_customer_photo(photo_id: str, request: Request):
    """Delete a photo for the authenticated user"""
    auth_header = request.headers.get("Authorization")
    customer = await verify_token_and_get_customer(auth_header)
    customer_id = customer.get("id")
    
    from bson import ObjectId
    try:
        result = await db.customer_photos.delete_one({
            "_id": ObjectId(photo_id),
            "customerId": customer_id
        })
    except:
        raise HTTPException(status_code=400, detail="Ungültige Photo-ID")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Foto nicht gefunden")
    
    return {"message": "Foto gelöscht"}

# ============== FAHRZEUGSCHEIN SCANS ROUTES (User-specific) ==============

class ScanCreate(BaseModel):
    imageBase64: Optional[str] = None
    vehicleData: dict
    selectedStage: Optional[dict] = None

@api_router.post("/customer/scans")
async def save_scan(scan: ScanCreate, request: Request):
    """Save a fahrzeugschein scan for the authenticated user"""
    auth_header = request.headers.get("Authorization")
    customer = await verify_token_and_get_customer(auth_header)
    customer_id = customer.get("id")
    
    scan_doc = {
        "customerId": customer_id,
        "customerEmail": customer.get("email"),
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "vehicleData": scan.vehicleData,
        "selectedStage": scan.selectedStage,
        "imageBase64": scan.imageBase64,
        "status": "saved",
    }
    
    result = await db.customer_scans.insert_one(scan_doc)
    
    return {
        "id": str(result.inserted_id),
        "createdAt": scan_doc["createdAt"],
        "vehicleData": scan.vehicleData,
    }

@api_router.get("/customer/scans")
async def get_scans(request: Request):
    """Get all scans for the authenticated user"""
    auth_header = request.headers.get("Authorization")
    customer = await verify_token_and_get_customer(auth_header)
    customer_id = customer.get("id")
    
    cursor = db.customer_scans.find(
        {"customerId": customer_id},
        {"imageBase64": 0}  # Exclude image data for list view
    ).sort("createdAt", -1)
    
    scans = await cursor.to_list(length=100)
    
    for scan in scans:
        scan["id"] = str(scan["_id"])
        del scan["_id"]
    
    return scans

# ============== TICKETS ROUTES (User-specific) ==============

class TicketCreate(BaseModel):
    subject: str
    message: str
    priority: str = "normal"

class TicketMessageCreate(BaseModel):
    message: str

@api_router.post("/customer/tickets")
async def create_ticket(ticket: TicketCreate, request: Request):
    """Create a new ticket for the authenticated user"""
    auth_header = request.headers.get("Authorization")
    customer = await verify_token_and_get_customer(auth_header)
    customer_id = customer.get("id")
    
    # Generate ticket number
    ticket_count = await db.customer_tickets.count_documents({"customerId": customer_id})
    ticket_number = f"TKT-{customer_id}-{ticket_count + 1:04d}"
    
    now = datetime.now(timezone.utc).isoformat()
    
    ticket_doc = {
        "ticketNumber": ticket_number,
        "customerId": customer_id,
        "customerEmail": customer.get("email"),
        "companyName": customer.get("companyName"),
        "subject": ticket.subject,
        "priority": ticket.priority,
        "status": "open",
        "createdAt": now,
        "lastReply": now,
        "messages": [
            {
                "sender": "customer",
                "senderName": customer.get("email"),
                "message": ticket.message,
                "createdAt": now,
            }
        ],
    }
    
    result = await db.customer_tickets.insert_one(ticket_doc)
    ticket_doc["id"] = str(result.inserted_id)
    del ticket_doc["_id"]
    del ticket_doc["messages"]  # Don't return messages in create response
    
    return ticket_doc

@api_router.get("/customer/tickets")
async def get_tickets(request: Request):
    """Get all tickets for the authenticated user"""
    auth_header = request.headers.get("Authorization")
    customer = await verify_token_and_get_customer(auth_header)
    customer_id = customer.get("id")
    
    cursor = db.customer_tickets.find(
        {"customerId": customer_id}
    ).sort("createdAt", -1)
    
    tickets = await cursor.to_list(length=100)
    
    for ticket in tickets:
        ticket["id"] = str(ticket["_id"])
        del ticket["_id"]
        ticket["messageCount"] = len(ticket.get("messages", []))
        del ticket["messages"]  # Don't return full messages in list
    
    return tickets

@api_router.get("/customer/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, request: Request):
    """Get a specific ticket with messages"""
    auth_header = request.headers.get("Authorization")
    customer = await verify_token_and_get_customer(auth_header)
    customer_id = customer.get("id")
    
    ticket = await db.customer_tickets.find_one({
        "ticketNumber": ticket_id,
        "customerId": customer_id
    })
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    
    ticket["id"] = str(ticket["_id"])
    del ticket["_id"]
    
    return ticket

@api_router.post("/customer/tickets/{ticket_id}/reply")
async def reply_to_ticket(ticket_id: str, reply: TicketMessageCreate, request: Request):
    """Add a reply to a ticket"""
    auth_header = request.headers.get("Authorization")
    customer = await verify_token_and_get_customer(auth_header)
    customer_id = customer.get("id")
    
    now = datetime.now(timezone.utc).isoformat()
    
    new_message = {
        "sender": "customer",
        "senderName": customer.get("email"),
        "message": reply.message,
        "createdAt": now,
    }
    
    result = await db.customer_tickets.update_one(
        {"ticketNumber": ticket_id, "customerId": customer_id},
        {
            "$push": {"messages": new_message},
            "$set": {"lastReply": now, "status": "open"}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    
    return {"message": "Antwort gesendet", "createdAt": now}

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
