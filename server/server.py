# server.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import os
from contextlib import contextmanager

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

# For development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)