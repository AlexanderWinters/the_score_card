# server.py
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import os
from contextlib import contextmanager
from fastapi.responses import JSONResponse
import json
import csv
from io import StringIO


app = FastAPI(title="Golf Course API")



# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

DB_PATH = 'golf.db'

# Database connection context manager
@contextmanager
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

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
    color: str
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
    color: str
    holes: List[HoleCreate]

class CourseCreate(BaseModel):
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    teeBoxes: List[TeeBoxCreate]

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
            color TEXT NOT NULL,
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

        conn.commit()

@app.on_event("startup")
async def startup_event():
    # Initialize database on startup
    if not os.path.exists(DB_PATH):
        initialize_database()
    else:
        # Make sure schema is up to date
        initialize_database()

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
                'INSERT INTO tee_boxes (course_id, name, color) VALUES (?, ?, ?)',
                (course_id, tee_box.name, tee_box.color)
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
                (course_id, 'Championship', 'Black'),
                (course_id, 'Club', 'Blue'),
                (course_id, 'Forward', 'Red')
            ]

            cursor.executemany(
                'INSERT INTO tee_boxes (course_id, name, color) VALUES (?, ?, ?)',
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
                    if not all(key in tee_box for key in ['name', 'color', 'holes']):
                        continue  # Skip invalid tee boxes

                    cursor.execute(
                        'INSERT INTO tee_boxes (course_id, name, color) VALUES (?, ?, ?)',
                        (course_id, tee_box.get('name'), tee_box.get('color'))
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
            tee_color = row.get('tee_color', '').strip()
            if not tee_name or not tee_color:
                continue

            tee_key = f"{tee_name}_{tee_color}"
            if tee_key not in courses_data[course_name]['teeBoxes']:
                courses_data[course_name]['teeBoxes'][tee_key] = {
                    'name': tee_name,
                    'color': tee_color,
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
                        'INSERT INTO tee_boxes (course_id, name, color) VALUES (?, ?, ?)',
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