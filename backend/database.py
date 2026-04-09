import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import uuid
import logging
from models import SessionData, ExerciseResult, ProgressReport

logger = logging.getLogger(__name__)

class Database:
    def __init__(self, db_path: Optional[str] = None):
        import os
        self.db_path = db_path or os.path.join(os.path.dirname(__file__), "therapy_ai.db")
        self.init_database()
    
    def init_database(self):
        """
        Initialize database with required tables
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Users table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        email TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        role TEXT DEFAULT 'patient',
                        doctor_id TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Sessions table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS sessions (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        exercise_type TEXT NOT NULL,
                        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        ended_at TIMESTAMP,
                        duration_seconds INTEGER,
                        total_frames INTEGER DEFAULT 0,
                        average_score REAL DEFAULT 0.0,
                        status TEXT DEFAULT 'active',
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """)
                
                # Session data table (individual frame analysis)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS session_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id TEXT,
                        user_id TEXT NOT NULL,
                        exercise_type TEXT NOT NULL,
                        timestamp TIMESTAMP NOT NULL,
                        score REAL NOT NULL,
                        is_correct BOOLEAN NOT NULL,
                        feedback TEXT,
                        corrections TEXT,
                        pose_landmarks TEXT,
                        FOREIGN KEY (session_id) REFERENCES sessions (id),
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """)
                
                # Exercise results table (aggregated data)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS exercise_results (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        exercise_type TEXT NOT NULL,
                        date DATE NOT NULL,
                        total_sessions INTEGER DEFAULT 0,
                        total_duration_minutes REAL DEFAULT 0.0,
                        average_score REAL DEFAULT 0.0,
                        improvement_rate REAL DEFAULT 0.0,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """)
                
                # Doctor-patient relationships
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS doctor_patients (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        doctor_id TEXT NOT NULL,
                        patient_id TEXT NOT NULL,
                        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        status TEXT DEFAULT 'active',
                        FOREIGN KEY (doctor_id) REFERENCES users (id),
                        FOREIGN KEY (patient_id) REFERENCES users (id),
                        UNIQUE(doctor_id, patient_id)
                    )
                """)
                
                # Progress reports table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS progress_reports (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        doctor_id TEXT,
                        report_date DATE NOT NULL,
                        report_data TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id),
                        FOREIGN KEY (doctor_id) REFERENCES users (id)
                    )
                """)
                
                # Scheduled exercises table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS scheduled_exercises (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        exercise_type TEXT NOT NULL,
                        scheduled_date DATE NOT NULL,
                        scheduled_time TIME NOT NULL,
                        completed BOOLEAN DEFAULT FALSE,
                        completed_at TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """)
                
                # Doctor invitation codes table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS doctor_invites (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        doctor_id TEXT NOT NULL,
                        invite_code TEXT NOT NULL,
                        used BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (doctor_id) REFERENCES users (id)
                    )
                """)
                
                # Therapy plans table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS therapy_plans (
                        id TEXT PRIMARY KEY,
                        patient_id TEXT NOT NULL,
                        doctor_id TEXT NOT NULL,
                        title TEXT NOT NULL,
                        description TEXT,
                        exercises TEXT,
                        duration_weeks INTEGER DEFAULT 4,
                        status TEXT DEFAULT 'active',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (patient_id) REFERENCES users (id),
                        FOREIGN KEY (doctor_id) REFERENCES users (id)
                    )
                """)
                
                # Prescriptions table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS prescriptions (
                        id TEXT PRIMARY KEY,
                        patient_id TEXT NOT NULL,
                        doctor_id TEXT NOT NULL,
                        exercise_type TEXT NOT NULL,
                        sets INTEGER NOT NULL,
                        reps INTEGER NOT NULL,
                        frequency TEXT NOT NULL,
                        duration TEXT,
                        notes TEXT,
                        status TEXT DEFAULT 'active',
                        prescribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (patient_id) REFERENCES users (id),
                        FOREIGN KEY (doctor_id) REFERENCES users (id)
                    )
                """)
                
                # Patient sessions (doctor assigned)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS assigned_sessions (
                        id TEXT PRIMARY KEY,
                        patient_id TEXT NOT NULL,
                        doctor_id TEXT NOT NULL,
                        exercise_type TEXT NOT NULL,
                        scheduled_date DATE NOT NULL,
                        scheduled_time TIME NOT NULL,
                        status TEXT DEFAULT 'scheduled',
                        completed_at TIMESTAMP,
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (patient_id) REFERENCES users (id),
                        FOREIGN KEY (doctor_id) REFERENCES users (id)
                    )
                """)
                
                conn.commit()
                logger.info("Database initialized successfully")
                
        except Exception as e:
            logger.error(f"Error initializing database: {str(e)}")
            raise
    
    def create_user(self, name: str, email: str, password_hash: str, role: str = "patient", doctor_id: Optional[str] = None) -> str:
        """
        Create a new user
        """
        user_id = str(uuid.uuid4())
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO users (id, name, email, password_hash, role, doctor_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (user_id, name, email, password_hash, role, doctor_id))
                conn.commit()
                
            logger.info(f"Created user: {user_id}")
            return user_id
            
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise
    
    def authenticate_user(self, email: str, password_hash: str, role: str = "patient") -> Optional[Dict]:
        """
        Authenticate a user by email and password
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, name, email, role, doctor_id
                    FROM users 
                    WHERE email = ? AND password_hash = ? AND role = ?
                """, (email, password_hash, role))
                
                row = cursor.fetchone()
                if row:
                    return {
                        "id": row[0],
                        "name": row[1],
                        "email": row[2],
                        "role": row[3],
                        "doctor_id": row[4]
                    }
                return None
                
        except Exception as e:
            logger.error(f"Error authenticating user: {str(e)}")
            return None
    
    def create_session(self, user_id: str, exercise_type: str) -> str:
        """
        Create a new therapy session
        """
        session_id = str(uuid.uuid4())
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO sessions (id, user_id, exercise_type)
                    VALUES (?, ?, ?)
                """, (session_id, user_id, exercise_type))
                conn.commit()
                
            logger.info(f"Created session: {session_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"Error creating session: {str(e)}")
            raise
    
    def store_session_data(self, data: SessionData, session_id: Optional[str] = None):
        """
        Store individual frame analysis data
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO session_data 
                    (session_id, user_id, exercise_type, timestamp, score, is_correct, feedback, corrections)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    session_id or "pending",
                    data.user_id,
                    data.exercise_type,
                    data.timestamp,
                    data.score,
                    data.is_correct,
                    data.feedback,
                    json.dumps(data.corrections) if data.corrections else None
                ))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error storing session data: {str(e)}")
            raise
    
    def end_session(self, session_id: str) -> Dict:
        """
        End a session and generate summary
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get session data
                cursor.execute("""
                    SELECT COUNT(*) as frame_count, AVG(score) as avg_score, 
                           MIN(timestamp) as start_time, MAX(timestamp) as end_time
                    FROM session_data 
                    WHERE session_id = ?
                """, (session_id,))
                
                result = cursor.fetchone()
                if not result:
                    raise ValueError("Session not found")
                
                frame_count, avg_score, start_time, end_time = result
                
                # Calculate duration
                if start_time and end_time:
                    start_dt = datetime.fromisoformat(start_time)
                    end_dt = datetime.fromisoformat(end_time)
                    duration = (end_dt - start_dt).total_seconds()
                else:
                    duration = 0
                
                # Update session
                cursor.execute("""
                    UPDATE sessions 
                    SET ended_at = CURRENT_TIMESTAMP, 
                        duration_seconds = ?, 
                        total_frames = ?, 
                        average_score = ?,
                        status = 'completed'
                    WHERE id = ?
                """, (duration, frame_count, avg_score or 0, session_id))
                
                conn.commit()
                
                return {
                    "session_id": session_id,
                    "duration_seconds": duration,
                    "total_frames": frame_count,
                    "average_score": avg_score or 0,
                    "status": "completed"
                }
                
        except Exception as e:
            logger.error(f"Error ending session: {str(e)}")
            raise
    
    def get_user_progress(self, user_id: str, start_date: datetime, end_date: datetime) -> List[Dict]:
        """
        Get user progress data for a date range
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT 
                        DATE(timestamp) as date,
                        exercise_type,
                        COUNT(*) as session_count,
                        AVG(score) as avg_score,
                        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as accuracy_rate
                    FROM session_data 
                    WHERE user_id = ? AND timestamp BETWEEN ? AND ?
                    GROUP BY DATE(timestamp), exercise_type
                    ORDER BY date DESC
                """, (user_id, start_date.isoformat(), end_date.isoformat()))
                
                results = cursor.fetchall()
                
                progress_data = []
                for row in results:
                    progress_data.append({
                        "date": row[0],
                        "exercise_type": row[1],
                        "session_count": row[2],
                        "average_score": round(row[3], 2),
                        "accuracy_rate": round(row[4], 2)
                    })
                
                return progress_data
                
        except Exception as e:
            logger.error(f"Error getting user progress: {str(e)}")
            raise
    
    def get_progress_summary(self, user_id: str, start_date: datetime, end_date: datetime) -> Dict:
        """
        Get progress summary for a user
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Overall stats
                cursor.execute("""
                    SELECT 
                        COUNT(DISTINCT DATE(timestamp)) as active_days,
                        COUNT(*) as total_frames,
                        AVG(score) as overall_avg_score,
                        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as overall_accuracy
                    FROM session_data 
                    WHERE user_id = ? AND timestamp BETWEEN ? AND ?
                """, (user_id, start_date.isoformat(), end_date.isoformat()))
                
                overall_stats = cursor.fetchone()
                
                # Exercise breakdown
                cursor.execute("""
                    SELECT 
                        exercise_type,
                        COUNT(*) as frame_count,
                        AVG(score) as avg_score,
                        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as accuracy_rate
                    FROM session_data 
                    WHERE user_id = ? AND timestamp BETWEEN ? AND ?
                    GROUP BY exercise_type
                """, (user_id, start_date.isoformat(), end_date.isoformat()))
                
                exercise_breakdown = cursor.fetchall()
                
                return {
                    "active_days": overall_stats[0] or 0,
                    "total_frames": overall_stats[1] or 0,
                    "overall_average_score": round(overall_stats[2] or 0, 2),
                    "overall_accuracy": round(overall_stats[3] or 0, 2),
                    "exercise_breakdown": [
                        {
                            "exercise_type": row[0],
                            "frame_count": row[1],
                            "average_score": round(row[2], 2),
                            "accuracy_rate": round(row[3], 2)
                        }
                        for row in exercise_breakdown
                    ]
                }
                
        except Exception as e:
            logger.error(f"Error getting progress summary: {str(e)}")
            raise
    
    def get_doctor_patients(self, doctor_id: str) -> List[Dict]:
        """
        Get all patients assigned to a doctor
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT 
                        u.id, u.name, u.email, u.created_at,
                        dp.assigned_at, dp.status,
                        COUNT(DISTINCT s.id) as total_sessions,
                        AVG(s.average_score) as avg_score
                    FROM users u
                    JOIN doctor_patients dp ON u.id = dp.patient_id
                    LEFT JOIN sessions s ON u.id = s.user_id
                    WHERE dp.doctor_id = ? AND dp.status = 'active'
                    GROUP BY u.id, u.name, u.email, u.created_at, dp.assigned_at, dp.status
                    ORDER BY dp.assigned_at DESC
                """, (doctor_id,))
                
                results = cursor.fetchall()
                
                patients = []
                for row in results:
                    patients.append({
                        "id": row[0],
                        "name": row[1],
                        "email": row[2],
                        "created_at": row[3],
                        "assigned_at": row[4],
                        "status": row[5],
                        "total_sessions": row[6] or 0,
                        "average_score": round(row[7] or 0, 2)
                    })
                
                return patients
                
        except Exception as e:
            logger.error(f"Error getting doctor patients: {str(e)}")
            raise
    
    def generate_patient_report(self, patient_id: str, doctor_id: str) -> Dict:
        """
        Generate comprehensive patient report for doctor
        """
        try:
            # Get patient info
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Patient basic info
                cursor.execute("""
                    SELECT name, email, created_at 
                    FROM users 
                    WHERE id = ?
                """, (patient_id,))
                
                patient_info = cursor.fetchone()
                if not patient_info:
                    raise ValueError("Patient not found")
                
                # Recent progress (last 30 days)
                end_date = datetime.now()
                start_date = end_date - timedelta(days=30)
                
                progress_data = self.get_user_progress(patient_id, start_date, end_date)
                summary = self.get_progress_summary(patient_id, start_date, end_date)
                
                # Session history
                cursor.execute("""
                    SELECT 
                        exercise_type, started_at, ended_at, 
                        duration_seconds, average_score, total_frames
                    FROM sessions 
                    WHERE user_id = ? AND status = 'completed'
                    ORDER BY started_at DESC
                    LIMIT 10
                """, (patient_id,))
                
                recent_sessions = cursor.fetchall()
                
                report = {
                    "patient_info": {
                        "id": patient_id,
                        "name": patient_info[0],
                        "email": patient_info[1],
                        "created_at": patient_info[2]
                    },
                    "report_period": {
                        "start_date": start_date.isoformat(),
                        "end_date": end_date.isoformat(),
                        "days": 30
                    },
                    "summary": summary,
                    "progress_data": progress_data,
                    "recent_sessions": [
                        {
                            "exercise_type": row[0],
                            "started_at": row[1],
                            "ended_at": row[2],
                            "duration_seconds": row[3],
                            "average_score": round(row[4] or 0, 2),
                            "total_frames": row[5]
                        }
                        for row in recent_sessions
                    ],
                    "generated_at": datetime.now().isoformat(),
                    "generated_by": doctor_id
                }
                
                # Store report
                cursor.execute("""
                    INSERT INTO progress_reports (user_id, doctor_id, report_date, report_data)
                    VALUES (?, ?, ?, ?)
                """, (patient_id, doctor_id, datetime.now().date(), json.dumps(report)))
                
                conn.commit()
                
                return report
                
        except Exception as e:
            logger.error(f"Error generating patient report: {str(e)}")
            raise
    
    def is_connected(self) -> bool:
        """
        Check if database connection is working
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                return True
        except:
            return False
    
    def schedule_exercise(self, user_id: str, exercise_type: str, scheduled_date: str, scheduled_time: str) -> Dict:
        """
        Schedule an exercise for a user
        """
        schedule_id = str(uuid.uuid4())
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO scheduled_exercises (id, user_id, exercise_type, scheduled_date, scheduled_time)
                    VALUES (?, ?, ?, ?, ?)
                """, (schedule_id, user_id, exercise_type, scheduled_date, scheduled_time))
                conn.commit()
                
            return {
                "id": schedule_id,
                "user_id": user_id,
                "exercise_type": exercise_type,
                "scheduled_date": scheduled_date,
                "scheduled_time": scheduled_time,
                "completed": False
            }
            
        except Exception as e:
            logger.error(f"Error scheduling exercise: {str(e)}")
            raise
    
    def get_scheduled_exercises(self, user_id: str) -> List[Dict]:
        """
        Get all scheduled exercises for a user
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, exercise_type, scheduled_date, scheduled_time, completed, completed_at
                    FROM scheduled_exercises
                    WHERE user_id = ?
                    ORDER BY scheduled_date ASC, scheduled_time ASC
                """, (user_id,))
                
                results = cursor.fetchall()
                
                return [
                    {
                        "id": row[0],
                        "exercise_type": row[1],
                        "scheduled_date": row[2],
                        "scheduled_time": row[3],
                        "completed": bool(row[4]),
                        "completed_at": row[5]
                    }
                    for row in results
                ]
                
        except Exception as e:
            logger.error(f"Error getting scheduled exercises: {str(e)}")
            return []
    
    def complete_scheduled_exercise(self, schedule_id: str) -> None:
        """
        Mark a scheduled exercise as completed
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE scheduled_exercises
                    SET completed = TRUE, completed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (schedule_id,))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error completing scheduled exercise: {str(e)}")
            raise
    
    def delete_scheduled_exercise(self, schedule_id: str) -> None:
        """
        Delete a scheduled exercise
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM scheduled_exercises WHERE id = ?", (schedule_id,))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error deleting scheduled exercise: {str(e)}")
            raise
    
    def create_doctor_invite(self, doctor_id: str) -> str:
        """
        Create an invitation code for a doctor
        """
        import random
        import string
        invite_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO doctor_invites (doctor_id, invite_code, created_at)
                    VALUES (?, ?, datetime('now'))
                """, (doctor_id, invite_code))
                conn.commit()
                
            return invite_code
            
        except Exception as e:
            logger.error(f"Error creating invite: {str(e)}")
            raise
    
    def get_doctor_invites(self, doctor_id: str) -> List[Dict]:
        """
        Get all invitation codes for a doctor
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT doctor_id, invite_code, created_at, used
                    FROM doctor_invites
                    WHERE doctor_id = ?
                    ORDER BY created_at DESC
                """, (doctor_id,))
                
                results = cursor.fetchall()
                
                return [
                    {
                        "doctor_id": row[0],
                        "invite_code": row[1],
                        "created_at": row[2],
                        "used": bool(row[3])
                    }
                    for row in results
                ]
                
        except Exception as e:
            logger.error(f"Error getting invites: {str(e)}")
            return []
    
    def use_invite_code(self, invite_code: str) -> Optional[str]:
        """
        Use an invitation code to link a patient to a doctor
        Returns doctor_id if valid, None otherwise
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT doctor_id FROM doctor_invites
                    WHERE invite_code = ? AND used = 0
                """, (invite_code,))
                
                row = cursor.fetchone()
                if row:
                    doctor_id = row[0]
                    cursor.execute("""
                        UPDATE doctor_invites SET used = 1 WHERE invite_code = ?
                    """, (invite_code,))
                    conn.commit()
                    return doctor_id
                return None
                
        except Exception as e:
            logger.error(f"Error using invite: {str(e)}")
            return None
    
    def assign_patient_to_doctor(self, patient_id: str, doctor_id: str) -> None:
        """
        Assign a patient to a doctor directly
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR IGNORE INTO doctor_patients (doctor_id, patient_id, assigned_at)
                    VALUES (?, ?, datetime('now'))
                """, (doctor_id, patient_id))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error assigning patient: {str(e)}")
            raise
    
    def remove_patient_from_doctor(self, patient_id: str, doctor_id: str) -> None:
        """
        Remove a patient from a doctor's care
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE doctor_patients SET status = 'removed'
                    WHERE doctor_id = ? AND patient_id = ?
                """, (doctor_id, patient_id))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error removing patient: {str(e)}")
            raise
    
    def find_patients_without_doctor(self, search_term: str = "") -> List[Dict]:
        """
        Find patients not assigned to any doctor or search by name/email
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                if search_term:
                    cursor.execute("""
                        SELECT id, name, email, created_at
                        FROM users
                        WHERE role = 'patient' AND doctor_id IS NULL
                        AND (name LIKE ? OR email LIKE ?)
                        LIMIT 20
                    """, (f"%{search_term}%", f"%{search_term}%"))
                else:
                    cursor.execute("""
                        SELECT id, name, email, created_at
                        FROM users
                        WHERE role = 'patient' AND doctor_id IS NULL
                        LIMIT 20
                    """)
                
                results = cursor.fetchall()
                
                return [
                    {
                        "id": row[0],
                        "name": row[1],
                        "email": row[2],
                        "created_at": row[3]
                    }
                    for row in results
                ]
                
        except Exception as e:
            logger.error(f"Error finding patients: {str(e)}")
            return []
    
    def create_therapy_plan(self, patient_id: str, doctor_id: str, title: str, description: str, exercises: List[str], duration_weeks: int = 4) -> str:
        """Create a therapy plan for a patient"""
        plan_id = str(uuid.uuid4())
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO therapy_plans (id, patient_id, doctor_id, title, description, exercises, duration_weeks)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (plan_id, patient_id, doctor_id, title, description, json.dumps(exercises), duration_weeks))
                conn.commit()
            return plan_id
        except Exception as e:
            logger.error(f"Error creating therapy plan: {str(e)}")
            raise
    
    def get_patient_therapy_plans(self, patient_id: str) -> List[Dict]:
        """Get all therapy plans for a patient"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, patient_id, doctor_id, title, description, exercises, duration_weeks, status, created_at
                    FROM therapy_plans
                    WHERE patient_id = ?
                    ORDER BY created_at DESC
                """, (patient_id,))
                results = cursor.fetchall()
                return [
                    {
                        "id": row[0],
                        "patient_id": row[1],
                        "doctor_id": row[2],
                        "title": row[3],
                        "description": row[4],
                        "exercises": json.loads(row[5]) if row[5] else [],
                        "duration_weeks": row[6],
                        "status": row[7],
                        "created_at": row[8]
                    }
                    for row in results
                ]
        except Exception as e:
            logger.error(f"Error getting therapy plans: {str(e)}")
            return []
    
    def create_prescription(self, patient_id: str, doctor_id: str, exercise_type: str, sets: int, reps: int, frequency: str, duration: str = None, notes: str = None) -> str:
        """Create a prescription for a patient"""
        prescription_id = str(uuid.uuid4())
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO prescriptions (id, patient_id, doctor_id, exercise_type, sets, reps, frequency, duration, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (prescription_id, patient_id, doctor_id, exercise_type, sets, reps, frequency, duration, notes))
                conn.commit()
            return prescription_id
        except Exception as e:
            logger.error(f"Error creating prescription: {str(e)}")
            raise
    
    def get_patient_prescriptions(self, patient_id: str) -> List[Dict]:
        """Get all prescriptions for a patient"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, patient_id, doctor_id, exercise_type, sets, reps, frequency, duration, notes, status, prescribed_at
                    FROM prescriptions
                    WHERE patient_id = ?
                    ORDER BY prescribed_at DESC
                """, (patient_id,))
                results = cursor.fetchall()
                return [
                    {
                        "id": row[0],
                        "patient_id": row[1],
                        "doctor_id": row[2],
                        "exercise_type": row[3],
                        "sets": row[4],
                        "reps": row[5],
                        "frequency": row[6],
                        "duration": row[7],
                        "notes": row[8],
                        "status": row[9],
                        "prescribed_at": row[10]
                    }
                    for row in results
                ]
        except Exception as e:
            logger.error(f"Error getting prescriptions: {str(e)}")
            return []
    
    def create_assigned_session(self, patient_id: str, doctor_id: str, exercise_type: str, scheduled_date: str, scheduled_time: str, notes: str = None) -> str:
        """Schedule a session for a patient"""
        session_id = str(uuid.uuid4())
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO assigned_sessions (id, patient_id, doctor_id, exercise_type, scheduled_date, scheduled_time, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (session_id, patient_id, doctor_id, exercise_type, scheduled_date, scheduled_time, notes))
                conn.commit()
            return session_id
        except Exception as e:
            logger.error(f"Error creating assigned session: {str(e)}")
            raise
    
    def get_patient_assigned_sessions(self, patient_id: str) -> List[Dict]:
        """Get all assigned sessions for a patient"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, patient_id, doctor_id, exercise_type, scheduled_date, scheduled_time, status, completed_at, notes, created_at
                    FROM assigned_sessions
                    WHERE patient_id = ?
                    ORDER BY scheduled_date ASC, scheduled_time ASC
                """, (patient_id,))
                results = cursor.fetchall()
                return [
                    {
                        "id": row[0],
                        "patient_id": row[1],
                        "doctor_id": row[2],
                        "exercise_type": row[3],
                        "scheduled_date": row[4],
                        "scheduled_time": row[5],
                        "status": row[6],
                        "completed_at": row[7],
                        "notes": row[8],
                        "created_at": row[9]
                    }
                    for row in results
                ]
        except Exception as e:
            logger.error(f"Error getting assigned sessions: {str(e)}")
            return []
    
    def get_doctor_assigned_sessions(self, doctor_id: str) -> List[Dict]:
        """Get all assigned sessions for a doctor's patients"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT s.id, s.patient_id, u.name, s.exercise_type, s.scheduled_date, s.scheduled_time, s.status, s.completed_at, s.notes, s.created_at
                    FROM assigned_sessions s
                    JOIN users u ON s.patient_id = u.id
                    WHERE s.doctor_id = ?
                    ORDER BY s.scheduled_date ASC, s.scheduled_time ASC
                """, (doctor_id,))
                results = cursor.fetchall()
                return [
                    {
                        "id": row[0],
                        "patient_id": row[1],
                        "patient_name": row[2],
                        "exercise_type": row[3],
                        "scheduled_date": row[4],
                        "scheduled_time": row[5],
                        "status": row[6],
                        "completed_at": row[7],
                        "notes": row[8],
                        "created_at": row[9]
                    }
                    for row in results
                ]
        except Exception as e:
            logger.error(f"Error getting assigned sessions: {str(e)}")
            return []
    
    def complete_assigned_session(self, session_id: str) -> None:
        """Mark an assigned session as completed"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE assigned_sessions SET status = 'completed', completed_at = datetime('now')
                    WHERE id = ?
                """, (session_id,))
                conn.commit()
        except Exception as e:
            logger.error(f"Error completing session: {str(e)}")
            raise
    
    def delete_assigned_session(self, session_id: str) -> None:
        """Delete an assigned session"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM assigned_sessions WHERE id = ?", (session_id,))
                conn.commit()
        except Exception as e:
            logger.error(f"Error deleting session: {str(e)}")
            raise

    def get_saved_reports(self, user_id: str = None, doctor_id: str = None) -> List[Dict]:
        """Get saved progress reports"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                if user_id:
                    cursor.execute("""
                        SELECT pr.id, pr.user_id, pr.doctor_id, pr.report_date, pr.created_at,
                               u.name as patient_name, d.name as doctor_name
                        FROM progress_reports pr
                        JOIN users u ON pr.user_id = u.id
                        LEFT JOIN users d ON pr.doctor_id = d.id
                        WHERE pr.user_id = ?
                        ORDER BY pr.created_at DESC
                    """, (user_id,))
                elif doctor_id:
                    cursor.execute("""
                        SELECT pr.id, pr.user_id, pr.doctor_id, pr.report_date, pr.created_at,
                               u.name as patient_name, d.name as doctor_name
                        FROM progress_reports pr
                        JOIN users u ON pr.user_id = u.id
                        LEFT JOIN users d ON pr.doctor_id = d.id
                        WHERE pr.doctor_id = ?
                        ORDER BY pr.created_at DESC
                    """, (doctor_id,))
                else:
                    cursor.execute("""
                        SELECT pr.id, pr.user_id, pr.doctor_id, pr.report_date, pr.created_at,
                               u.name as patient_name, d.name as doctor_name
                        FROM progress_reports pr
                        JOIN users u ON pr.user_id = u.id
                        LEFT JOIN users d ON pr.doctor_id = d.id
                        ORDER BY pr.created_at DESC
                    """)
                
                results = cursor.fetchall()
                return [
                    {
                        "id": row[0],
                        "user_id": row[1],
                        "doctor_id": row[2],
                        "report_date": row[3],
                        "created_at": row[4],
                        "patient_name": row[5],
                        "doctor_name": row[6]
                    }
                    for row in results
                ]
        except Exception as e:
            logger.error(f"Error getting saved reports: {str(e)}")
            return []

    def get_report_by_id(self, report_id: int) -> Optional[Dict]:
        """Get a specific report by ID"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, user_id, doctor_id, report_date, report_data, created_at
                    FROM progress_reports
                    WHERE id = ?
                """, (report_id,))
                
                row = cursor.fetchone()
                if row:
                    return {
                        "id": row[0],
                        "user_id": row[1],
                        "doctor_id": row[2],
                        "report_date": row[3],
                        "report_data": json.loads(row[4]),
                        "created_at": row[5]
                    }
                return None
        except Exception as e:
            logger.error(f"Error getting report by ID: {str(e)}")
            return None

    def get_improvement_trend(self, user_id: str, days: int = 30) -> Dict:
        """Calculate improvement trend for a user"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT 
                        DATE(timestamp) as date,
                        AVG(score) as daily_avg
                    FROM session_data 
                    WHERE user_id = ? AND timestamp >= datetime('now', '-' || ? || ' days')
                    GROUP BY DATE(timestamp)
                    ORDER BY date ASC
                """, (user_id, days))
                
                results = cursor.fetchall()
                
                if len(results) < 2:
                    return {"trend": "insufficient_data", "change": 0}
                
                first_week_avg = sum(r[1] for r in results[:7]) / min(len(results), 7)
                last_week_avg = sum(r[1] for r in results[-7:]) / min(len(results), 7)
                
                change = last_week_avg - first_week_avg
                
                return {
                    "trend": "improving" if change > 5 else "stable" if abs(change) <= 5 else "declining",
                    "change": round(change, 2),
                    "first_week_avg": round(first_week_avg, 2),
                    "last_week_avg": round(last_week_avg, 2),
                    "data_points": len(results)
                }
        except Exception as e:
            logger.error(f"Error calculating improvement trend: {str(e)}")
            return {"trend": "error", "change": 0}

    def get_compliance_rate(self, user_id: str, days: int = 30) -> Dict:
        """Calculate compliance rate based on scheduled vs completed sessions"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_scheduled
                    FROM scheduled_exercises
                    WHERE user_id = ? AND scheduled_date >= date('now', '-' || ? || ' days')
                """, (user_id, days))
                
                total_scheduled = cursor.fetchone()[0] or 0
                
                cursor.execute("""
                    SELECT 
                        COUNT(*) as completed
                    FROM scheduled_exercises
                    WHERE user_id = ? AND completed = 1 AND scheduled_date >= date('now', '-' || ? || ' days')
                """, (user_id, days))
                
                completed = cursor.fetchone()[0] or 0
                
                rate = (completed / total_scheduled * 100) if total_scheduled > 0 else 0
                
                return {
                    "total_scheduled": total_scheduled,
                    "completed": completed,
                    "compliance_rate": round(rate, 2)
                }
        except Exception as e:
            logger.error(f"Error calculating compliance rate: {str(e)}")
            return {"total_scheduled": 0, "completed": 0, "compliance_rate": 0}