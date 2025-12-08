from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from bson import ObjectId
import random
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# Models
class User(BaseModel):
    username: str
    password: str

class UserInDB(BaseModel):
    username: str
    hashed_password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str

class Customer(BaseModel):
    name: str
    phone: str
    address: str
    photo: str  # base64 encoded image

class Guarantor(BaseModel):
    name: str
    phone: str
    address: str
    relation: str
    photo: str  # base64 encoded image

class Vehicle(BaseModel):
    make: str
    model: str
    year: int
    registration_number: str
    vin: str
    color: str

class PaymentSchedule(BaseModel):
    installment_number: int
    due_date: str
    amount: float
    status: str  # paid, pending, overdue
    paid_date: Optional[str] = None

class LoanDetails(BaseModel):
    loan_amount: float
    interest_rate: float
    tenure_months: int
    emi_amount: float
    total_amount: float
    amount_paid: float
    outstanding_amount: float

class Contract(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contract_number: str
    contract_date: str
    status: str  # active, completed, overdue
    customer: Customer
    guarantor: Guarantor
    vehicle: Vehicle
    loan: LoanDetails
    payment_schedule: List[PaymentSchedule]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ContractListItem(BaseModel):
    id: str
    contract_number: str
    customer_name: str
    vehicle_registration: str
    company_name: str
    status: str
    outstanding_amount: float
    emi_amount: float
    contract_date: str

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

# Generate sample base64 image (colored rectangle)
def generate_sample_image(color: str) -> str:
    # Simple SVG converted to base64
    svg = f'''<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="{color}"/>
        <text x="100" y="100" text-anchor="middle" fill="white" font-size="20">Photo</text>
    </svg>'''
    return f"data:image/svg+xml;base64,{base64.b64encode(svg.encode()).decode()}"

# Routes
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    user = await db.users.find_one({"username": login_data.username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    if not verify_password(login_data.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    access_token = create_access_token(data={"sub": login_data.username})
    return LoginResponse(
        access_token=access_token,
        username=login_data.username
    )

@api_router.get("/contracts", response_model=List[ContractListItem])
async def get_contracts(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    sort_by: Optional[str] = "date",
    username: str = Depends(verify_token)
):
    query = {}
    
    # Search functionality
    if search:
        query["$or"] = [
            {"customer.name": {"$regex": search, "$options": "i"}},
            {"contract_number": {"$regex": search, "$options": "i"}},
            {"vehicle.make": {"$regex": search, "$options": "i"}},
            {"vehicle.model": {"$regex": search, "$options": "i"}},
        ]
    
    # Status filter
    if status_filter and status_filter != "all":
        query["status"] = status_filter
    
    contracts = await db.contracts.find(query).to_list(1000)
    
    # Convert to list items
    contract_list = []
    for contract in contracts:
        contract_list.append(ContractListItem(
            id=contract['id'],
            contract_number=contract['contract_number'],
            customer_name=contract['customer']['name'],
            vehicle_registration=contract['vehicle']['registration_number'],
            company_name=contract.get('company_name', 'Vehicle Finance Ltd'),
            status=contract['status'],
            outstanding_amount=contract['loan']['outstanding_amount'],
            emi_amount=contract['loan']['emi_amount'],
            contract_date=contract['contract_date']
        ))
    
    # Sorting
    if sort_by == "date":
        contract_list.sort(key=lambda x: x.contract_date, reverse=True)
    elif sort_by == "customer":
        contract_list.sort(key=lambda x: x.customer_name)
    elif sort_by == "amount":
        contract_list.sort(key=lambda x: x.outstanding_amount, reverse=True)
    
    return contract_list

@api_router.get("/contracts/{contract_id}", response_model=Contract)
async def get_contract_detail(
    contract_id: str,
    username: str = Depends(verify_token)
):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Remove MongoDB _id field
    contract.pop('_id', None)
    return Contract(**contract)

@api_router.post("/seed-data")
async def seed_sample_data():
    """Generate sample data for testing"""
    # Check if data already exists
    existing_count = await db.contracts.count_documents({})
    if existing_count > 0:
        return {"message": f"Data already exists ({existing_count} contracts)", "created": False}
    
    # Create default user
    existing_user = await db.users.find_one({"username": "admin"})
    if not existing_user:
        await db.users.insert_one({
            "username": "admin",
            "hashed_password": hash_password("admin123")
        })
    
    # Sample data
    customer_names = ["Rajesh Kumar", "Priya Sharma", "Amit Patel", "Sneha Reddy", "Vikram Singh",
                      "Anita Desai", "Rahul Verma", "Deepika Rao", "Suresh Nair", "Kavita Joshi"]
    guarantor_names = ["Ramesh Kumar", "Sunita Sharma", "Prakash Patel", "Lakshmi Reddy", "Harpreet Singh",
                       "Manjula Desai", "Ravi Verma", "Padma Rao", "Krishna Nair", "Meena Joshi"]
    vehicle_makes = ["Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Honda"]
    vehicle_models = ["Swift", "i20", "Nexon", "XUV300", "City", "Venue", "Altroz", "Scorpio"]
    colors = ["White", "Silver", "Black", "Red", "Blue"]
    relations = ["Father", "Brother", "Uncle", "Friend", "Colleague"]
    
    contracts = []
    base_date = datetime(2023, 1, 1)
    
    for i in range(10):
        contract_date = base_date + timedelta(days=i*30)
        tenure = random.choice([12, 24, 36, 48, 60])
        loan_amount = random.randint(200000, 1000000)
        interest_rate = random.uniform(8.5, 12.5)
        
        # Calculate EMI
        monthly_rate = interest_rate / 12 / 100
        emi = loan_amount * monthly_rate * ((1 + monthly_rate) ** tenure) / (((1 + monthly_rate) ** tenure) - 1)
        emi = round(emi, 2)
        total_amount = emi * tenure
        
        # Calculate paid amount (random progress)
        months_elapsed = random.randint(0, min(tenure, 24))
        amount_paid = emi * months_elapsed
        outstanding = total_amount - amount_paid
        
        # Determine status
        if months_elapsed >= tenure:
            status = "completed"
        elif months_elapsed > 0 and random.random() < 0.2:
            status = "overdue"
        else:
            status = "active"
        
        # Generate payment schedule
        payment_schedule = []
        for month in range(1, tenure + 1):
            due_date = contract_date + timedelta(days=month*30)
            if month <= months_elapsed:
                payment_status = "paid"
                paid_date = due_date.strftime("%Y-%m-%d")
            elif month == months_elapsed + 1 and status == "overdue":
                payment_status = "overdue"
                paid_date = None
            else:
                payment_status = "pending"
                paid_date = None
            
            payment_schedule.append(PaymentSchedule(
                installment_number=month,
                due_date=due_date.strftime("%Y-%m-%d"),
                amount=emi,
                status=payment_status,
                paid_date=paid_date
            ).dict())
        
        contract = Contract(
            contract_number=f"VF{2023}{str(i+1).zfill(4)}",
            contract_date=contract_date.strftime("%Y-%m-%d"),
            status=status,
            customer=Customer(
                name=customer_names[i],
                phone=f"+91 {random.randint(7000000000, 9999999999)}",
                address=f"{random.randint(1, 999)} Main Street, City-{random.randint(100000, 999999)}",
                photo=generate_sample_image("#4A90E2")
            ),
            guarantor=Guarantor(
                name=guarantor_names[i],
                phone=f"+91 {random.randint(7000000000, 9999999999)}",
                address=f"{random.randint(1, 999)} Park Avenue, City-{random.randint(100000, 999999)}",
                relation=relations[i % len(relations)],
                photo=generate_sample_image("#E94B3C")
            ),
            vehicle=Vehicle(
                make=random.choice(vehicle_makes),
                model=random.choice(vehicle_models),
                year=random.randint(2020, 2024),
                registration_number=f"DL{random.randint(10, 99)}{chr(random.randint(65, 90))}{chr(random.randint(65, 90))}{random.randint(1000, 9999)}",
                vin=f"MA3{random.randint(10000000, 99999999)}{random.randint(100000, 999999)}",
                color=random.choice(colors)
            ),
            loan=LoanDetails(
                loan_amount=loan_amount,
                interest_rate=round(interest_rate, 2),
                tenure_months=tenure,
                emi_amount=emi,
                total_amount=round(total_amount, 2),
                amount_paid=round(amount_paid, 2),
                outstanding_amount=round(outstanding, 2)
            ),
            payment_schedule=payment_schedule
        )
        contracts.append(contract.dict())
    
    # Insert into database
    await db.contracts.insert_many(contracts)
    
    return {
        "message": "Sample data created successfully",
        "contracts_created": len(contracts),
        "default_credentials": {
            "username": "admin",
            "password": "admin123"
        }
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
