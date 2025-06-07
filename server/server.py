from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sqlite3
import os
from contextlib import contextmanager
from fastapi.responses import JSONResponse
import json
import csv
from io import StringIO
import secrets
import hashlib
import datetime
from jose import jwt, JWTError
from datetime import datetime, timedelta
import random
import string
from passlib.context import CryptContext

app = FastAPI(title="Golf Course API")

if os.environ.get("ENV") == "production":
    origins = [
        "https://your-production-domain.com",
        # Add other allowed origins
    ]
else:
    # For development, allow all
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DB_PATH = 'golf.db'
SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not SECRET_KEY:
    if os.environ.get("ENV") == "production":
        raise RuntimeError("JWT_SECRET_KEY environment variable must be set in production")
    else:
        print("WARNING: Using insecure development key. Never use this in production!")
        SECRET_KEY = "dev_only_insecure_key_for_testing"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # Token valid for 1 week

# Database connection context manager
@contextmanager
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Authentication models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

class RoundBase(BaseModel):
    course_id: int
    date: str
    scores: List[int]
    tee_box_id: int
    putts: Optional[List[int]] = None
    gir: Optional[List[bool]] = None
    fairways: Optional[List[bool]] = None
    bunkers: Optional[List[int]] = None

class RoundCreate(RoundBase):
    pass

class Round(RoundBase):
    id: int
    user_id: int

# Pydantic models for validation and documentation
class Hole(BaseModel):
    id: Optional[int] = None
    tee_box_id: int
    number: int
    distance: int
    par: int
    hcp_index: int

class TeeBox(BaseModel):
    id: Optional[int] = None
    course_id: int
    name: str
    #color: str
    holes: Optional[List[Hole]] = None

class Course(BaseModel):
    id: Optional[int] = None
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    teeBoxes: Optional[List[TeeBox]] = None

class HoleCreate(BaseModel):
    number: int
    distance: int
    par: int
    hcp_index: int

class TeeBoxCreate(BaseModel):
    name: str
    #color: str
    holes: List[HoleCreate]

class CourseCreate(BaseModel):
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    teeBoxes: List[TeeBoxCreate]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")

def initialize_database():
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Create courses table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT,
            description TEXT
        )
        ''')

        # Create tee_boxes table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS tee_boxes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            FOREIGN KEY (course_id) REFERENCES courses (id)
        )
        ''')

        # Create holes table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS holes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tee_box_id INTEGER NOT NULL,
            number INTEGER NOT NULL,
            distance INTEGER NOT NULL,
            par INTEGER NOT NULL,
            hcp_index INTEGER NOT NULL,
            FOREIGN KEY (tee_box_id) REFERENCES tee_boxes (id)
        )
        ''')

        # Create users table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

# Create rounds table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS rounds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            tee_box_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            scores TEXT NOT NULL,
            putts TEXT,
            gir TEXT,
            fairways TEXT,
            bunkers TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (course_id) REFERENCES courses (id),
             FOREIGN KEY (tee_box_id) REFERENCES tee_boxes (id)
         )
         ''')

        conn.commit()


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Password hashing
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# Generate a random user key (12 characters)
def generate_user_key():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))

# JWT token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# User authentication middleware
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        email = email.lower()
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    with get_db_connection() as conn:
        user = conn.execute(
            'SELECT * FROM users WHERE email = ?',
            (token_data.email,)
        ).fetchone()

    if user is None:
        raise credentials_exception
    return user

def validate_email(email: str) -> bool:
    """Basic email validation using a simple regex pattern"""
    import re
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None


@app.on_event("startup")
async def startup_event():
    # Initialize database on startup
    if not os.path.exists(DB_PATH):
        initialize_database()
    else:
        # Make sure schema is up to date
        initialize_database()

# Authentication endpoints
@app.post("/api/register", response_model=Token, status_code=201)
async def register_user(user_create: UserCreate):
    """Register a new user with an email and password"""

    email = user_create.email.lower()
    if not validate_email(email):
        raise HTTPException(
            status_code=400,
            detail="Invalid email format"
        )

    with get_db_connection() as conn:
        # Check if email already exists
        existing_user = conn.execute(
            'SELECT * FROM users WHERE email = ?',
            (email,)
        ).fetchone()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        # Hash the password and store the user
        password_hash = get_password_hash(user_create.password)

        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            (email, password_hash)
        )
        conn.commit()

        # Generate access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": email}, expires_delta=access_token_expires
        )

        return {"access_token": access_token, "token_type": "bearer"}

# @app.post("/api/generate-key")
# async def generate_key():
#     """Generate a random user key"""
#     return {"user_key": generate_user_key()}

@app.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint to get an access token using email and password"""

    email = form_data.username.lower()
    if not validate_email(email):
        raise HTTPException(
            status_code=400,
            detail="Invalid email format"
        )

    with get_db_connection() as conn:
        user = conn.execute(
            'SELECT * FROM users WHERE email = ?',
            (email,)  # OAuth2 uses username field for the email
        ).fetchone()

        if not user or not verify_password(form_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}


# User rounds management
@app.post("/api/rounds", status_code=201)
async def create_round(round_data: RoundCreate, current_user: dict = Depends(get_current_user)):
    """Save a completed round for the current user"""

    # Only save rounds with at least 9 holes completed
    scores = round_data.scores
    completed_holes = sum(1 for score in scores if score > 0)

    if completed_holes < 9:
        raise HTTPException(
            status_code=400,
            detail="Round must have at least 9 completed holes"
        )

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Convert scores list to JSON string
        scores_json = json.dumps(round_data.scores)

        # Convert stats to JSON strings if they exist
        putts_json = json.dumps(round_data.putts) if round_data.putts else None
        gir_json = json.dumps(round_data.gir) if round_data.gir else None
        fairways_json = json.dumps(round_data.fairways) if round_data.fairways else None
        bunkers_json = json.dumps(round_data.bunkers) if round_data.bunkers else None

        cursor.execute(
            '''INSERT INTO rounds
               (user_id, course_id, tee_box_id, date, scores, putts, gir, fairways, bunkers)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (current_user["id"], round_data.course_id, round_data.tee_box_id,
             round_data.date, scores_json, putts_json, gir_json, fairways_json, bunkers_json)
        )

        conn.commit()
        round_id = cursor.lastrowid

        return {"id": round_id, "message": "Round saved successfully"}

@app.get("/api/rounds")
async def get_user_rounds(current_user: dict = Depends(get_current_user)):
    """Get all rounds for the current user"""
    with get_db_connection() as conn:
        rounds_data = conn.execute(
            '''SELECT r.id, r.course_id, r.tee_box_id, r.date, r.scores,
                      r.putts, r.gir, r.fairways, r.bunkers,
                      c.name as course_name, t.name as tee_name
               FROM rounds r
                        JOIN courses c ON r.course_id = c.id
                        JOIN tee_boxes t ON r.tee_box_id = t.id
               WHERE r.user_id = ?
               ORDER BY r.date DESC''',
            (current_user["id"],)
        ).fetchall()

        result = []
        for round_data in rounds_data:
            scores = json.loads(round_data["scores"])

            # Parse statistics if they exist
            putts = json.loads(round_data["putts"]) if round_data["putts"] else None
            gir = json.loads(round_data["gir"]) if round_data["gir"] else None
            fairways = json.loads(round_data["fairways"]) if round_data["fairways"] else None
            bunkers = json.loads(round_data["bunkers"]) if round_data["bunkers"] else None

            result.append({
                "id": round_data["id"],
                "course_id": round_data["course_id"],
                "course_name": round_data["course_name"],
                "tee_box_id": round_data["tee_box_id"],
                "tee_name": round_data["tee_name"],
                #"tee_color": round_data["tee_color"],
                "date": round_data["date"],
                "scores": scores,
                "putts": putts,
                "gir": gir,
                "fairways": fairways,
                "bunkers": bunkers,
                "total_score": sum(score for score in scores if score > 0)
            })

        return result

# Existing endpoints
@app.get("/api/courses", response_model=List[Course])
async def get_all_courses():
    with get_db_connection() as conn:
        courses = conn.execute('SELECT * FROM courses').fetchall()
        return [dict(course) for course in courses]

@app.get("/api/check-database", status_code=200)
async def check_database():
    """Check if the database has any courses without seeding"""
    with get_db_connection() as conn:
        count = conn.execute('SELECT COUNT(*) as count FROM courses').fetchone()
        has_courses = count['count'] > 0

        return {
            "initialized": True,  # Database structure exists
            "has_courses": has_courses  # Database has course data
        }

@app.post("/api/courses", response_model=Course, status_code=201)
async def add_course(course: CourseCreate):
    """Add a new course with tee boxes and holes to the database"""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Insert the course
        cursor.execute(
            'INSERT INTO courses (name, location, description) VALUES (?, ?, ?)',
            (course.name, course.location, course.description)
        )
        course_id = cursor.lastrowid

        # Insert tee boxes and holes
        for tee_box in course.teeBoxes:
            cursor.execute(
                'INSERT INTO tee_boxes (course_id, name) VALUES (?, ?)',
                (course_id, tee_box.name)
            )
            tee_box_id = cursor.lastrowid

            # Insert holes for this tee box
            for hole in tee_box.holes:
                cursor.execute(
                    'INSERT INTO holes (tee_box_id, number, distance, par, hcp_index) VALUES (?, ?, ?, ?, ?)',
                    (tee_box_id, hole.number, hole.distance, hole.par, hole.hcp_index)
                )

        conn.commit()

        # Return the newly created course with all its details
        return await get_course_by_id(course_id)


@app.get("/api/courses/{course_id}", response_model=Course)
async def get_course_by_id(course_id: int):
    with get_db_connection() as conn:
        # Get course details
        course = conn.execute('SELECT * FROM courses WHERE id = ?', (course_id,)).fetchone()

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Get tee boxes for this course
        tee_boxes = conn.execute('SELECT * FROM tee_boxes WHERE course_id = ?', (course_id,)).fetchall()
        tee_boxes_list = [dict(tee_box) for tee_box in tee_boxes]

        # Get holes for each tee box
        for tee_box in tee_boxes_list:
            holes = conn.execute(
                'SELECT * FROM holes WHERE tee_box_id = ? ORDER BY number',
                (tee_box['id'],)
            ).fetchall()
            tee_box['holes'] = [dict(hole) for hole in holes]

        # Combine course with tee boxes
        course_dict = dict(course)
        course_dict['teeBoxes'] = tee_boxes_list

        return course_dict

@app.post("/api/seed", status_code=201)
async def seed_database():
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Clear existing data
        cursor.execute('DELETE FROM holes')
        cursor.execute('DELETE FROM tee_boxes')
        cursor.execute('DELETE FROM courses')

        # Insert courses
        courses = [
            ('Bro Hof Slott GC', 'Stockholm, Sweden', 'Championship level course'),
            ('Ullna Golf Club', 'Stockholm, Sweden', 'Beautiful lakeside course'),
            ('Halmstad GK (North)', 'Halmstad, Sweden', 'Classic Swedish course'),
            ('Falsterbo GK', 'Falsterbo, Sweden', 'Stunning coastal links'),
            ('Barsebäck Golf & CC', 'Barsebäck, Sweden', 'Former European Tour venue')
        ]

        cursor.executemany(
            'INSERT INTO courses (name, location, description) VALUES (?, ?, ?)',
            courses
        )

        # Get the actual course IDs that were inserted
        inserted_courses = cursor.execute('SELECT id FROM courses ORDER BY id').fetchall()

        # Insert tee boxes and holes for each actual course ID
        for course_row in inserted_courses:
            course_id = course_row['id']

            tee_boxes = [
                (course_id, 'Championship'),
                (course_id, 'Club'),
                (course_id, 'Forward')
            ]

            cursor.executemany(
                'INSERT INTO tee_boxes (course_id, name) VALUES (?, ?)',
                tee_boxes
            )

            # Get the tee box IDs we just inserted
            tee_box_rows = cursor.execute(
                'SELECT id FROM tee_boxes WHERE course_id = ?',
                (course_id,)
            ).fetchall()

            for tee_idx, tee_box_row in enumerate(tee_box_rows):
                tee_box_id = tee_box_row['id']

                # Different distance patterns for different tee boxes
                base_distance = 165 - (tee_idx * 15)
                distance_increment = 15 - (tee_idx * 2)

                holes = []
                for hole_number in range(1, 19):
                    distance = base_distance + ((hole_number - 1) * distance_increment)
                    par = 5 if hole_number % 4 == 0 else (3 if hole_number % 4 == 2 else 4)
                    hcp_index = ((hole_number * 7) % 18) + 1

                    holes.append((tee_box_id, hole_number, distance, par, hcp_index))

                cursor.executemany(
                    'INSERT INTO holes (tee_box_id, number, distance, par, hcp_index) VALUES (?, ?, ?, ?, ?)',
                    holes
                )

        conn.commit()

        return {"message": "Database seeded successfully"}

@app.post("/api/courses/json-upload", status_code=201)
async def upload_json_courses(file: UploadFile = File(...)):
    """Upload and process a JSON file containing course data"""
    try:
        # Read and parse the JSON file
        contents = await file.read()
        data = json.loads(contents.decode('utf-8'))

        # Handle both single course and multiple course formats
        courses_to_add = data if isinstance(data, list) else [data]

        added_course_ids = []

        with get_db_connection() as conn:
            cursor = conn.cursor()

            for course_data in courses_to_add:
                # Validate the course data structure (simplified)
                if not all(key in course_data for key in ['name', 'teeBoxes']):
                    raise HTTPException(
                        status_code=400,
                        detail="Invalid course data format. Each course must have 'name' and 'teeBoxes'"
                    )

                # Insert the course
                cursor.execute(
                    'INSERT INTO courses (name, location, description) VALUES (?, ?, ?)',
                    (course_data.get('name'), course_data.get('location'), course_data.get('description'))
                )
                course_id = cursor.lastrowid
                added_course_ids.append(course_id)

                # Process tee boxes
                for tee_box in course_data.get('teeBoxes', []):
                    if not all(key in tee_box for key in ['name', 'holes']):
                        continue  # Skip invalid tee boxes

                    cursor.execute(
                        'INSERT INTO tee_boxes (course_id, name) VALUES (?, ?)',
                        (course_id, tee_box.get('name'))
                    )
                    tee_box_id = cursor.lastrowid

                    # Process holes
                    for hole in tee_box.get('holes', []):
                        if not all(key in hole for key in ['number', 'distance', 'par', 'hcp_index']):
                            continue  # Skip invalid holes

                        cursor.execute(
                            'INSERT INTO holes (tee_box_id, number, distance, par, hcp_index) VALUES (?, ?, ?, ?, ?)',
                            (tee_box_id, hole.get('number'), hole.get('distance'),
                             hole.get('par'), hole.get('hcp_index'))
                        )

            conn.commit()

        return {"message": f"Successfully added {len(added_course_ids)} courses", "course_ids": added_course_ids}

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/api/courses/csv-upload", status_code=201)
async def upload_csv_courses(file: UploadFile = File(...)):
    """
    Upload and process a CSV file containing course data
    Expected CSV format:
    course_name,location,description,tee_name,tee_color,hole_number,distance,par,hcp_index
    """
    try:
        # Read and parse the CSV file
        contents = await file.read()
        csv_data = StringIO(contents.decode('utf-8'))
        csv_reader = csv.DictReader(csv_data)

        current_course = None
        current_tee = None
        courses_data = {}

        for row in csv_reader:
            # Extract course data
            course_name = row.get('course_name', '').strip()
            if not course_name:
                continue

            # If this is a new course, create its entry
            if course_name not in courses_data:
                courses_data[course_name] = {
                    'name': course_name,
                    'location': row.get('location', ''),
                    'description': row.get('description', ''),
                    'teeBoxes': {}
                }

            # Extract tee box data
            tee_name = row.get('tee_name', '').strip()
            #tee_color = row.get('tee_color', '').strip()
            if not tee_name: # or not tee_color:
                continue

            tee_key = f"{tee_name}"
            if tee_key not in courses_data[course_name]['teeBoxes']:
                courses_data[course_name]['teeBoxes'][tee_key] = {
                    'name': tee_name,
                    'holes': []
                }

            # Extract hole data
            try:
                hole_number = int(row.get('hole_number', 0))
                distance = int(row.get('distance', 0))
                par = int(row.get('par', 0))
                hcp_index = int(row.get('hcp_index', 0))

                if hole_number < 1 or distance < 1 or par < 1 or hcp_index < 1:
                    continue

                courses_data[course_name]['teeBoxes'][tee_key]['holes'].append({
                    'number': hole_number,
                    'distance': distance,
                    'par': par,
                    'hcp_index': hcp_index
                })
            except (ValueError, TypeError):
                continue

        # Prepare the processed data for database insertion
        processed_courses = []
        for course_name, course_data in courses_data.items():
            processed_course = {
                'name': course_data['name'],
                'location': course_data['location'],
                'description': course_data['description'],
                'teeBoxes': list(course_data['teeBoxes'].values())
            }
            processed_courses.append(processed_course)

        # Insert the processed courses
        added_course_ids = []
        with get_db_connection() as conn:
            cursor = conn.cursor()

            for course in processed_courses:
                # Skip courses without valid tee boxes or holes
                if not course['teeBoxes'] or not any(tee.get('holes') for tee in course['teeBoxes']):
                    continue

                # Insert the course
                cursor.execute(
                    'INSERT INTO courses (name, location, description) VALUES (?, ?, ?)',
                    (course['name'], course['location'], course['description'])
                )
                course_id = cursor.lastrowid
                added_course_ids.append(course_id)

                # Insert tee boxes and holes
                for tee_box in course['teeBoxes']:
                    if not tee_box.get('holes'):
                        continue

                    cursor.execute(
                        'INSERT INTO tee_boxes (course_id, name) VALUES (?, ?)',
                        (course_id, tee_box['name'], tee_box['color'])
                    )
                    tee_box_id = cursor.lastrowid

                    for hole in tee_box['holes']:
                        cursor.execute(
                            'INSERT INTO holes (tee_box_id, number, distance, par, hcp_index) VALUES (?, ?, ?, ?, ?)',
                            (tee_box_id, hole['number'], hole['distance'], hole['par'], hole['hcp_index'])
                        )

            conn.commit()

        return {"message": f"Successfully added {len(added_course_ids)} courses", "course_ids": added_course_ids}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV file: {str(e)}")


# For development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)