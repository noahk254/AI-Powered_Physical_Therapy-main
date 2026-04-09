from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import cv2
import numpy as np
import mediapipe as mp
import json
import base64
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional
import sqlite3
from pydantic import BaseModel
import asyncio
from pose_analyzer import PoseAnalyzer
from database import Database
from models import SessionData, ExerciseResult, ProgressReport
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TherapyAI Backend", version="1.0.0")

# CORS middleware - configure for production
FRONTEND_URL = os.environ.get("FRONTEND_URL", "")
ALLOWED_ORIGINS = os.environ.get("CORS_ORIGINS", "*")

if FRONTEND_URL:
    allowed_origins = [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"]
elif ALLOWED_ORIGINS == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = ALLOWED_ORIGINS.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static frontend build if exists
frontend_dist_path = os.path.join(os.path.dirname(__file__), "..", "sites", "ai-therapy", "dist")
print(f"Frontend dist path: {frontend_dist_path}")
print(f"Frontend exists: {os.path.exists(frontend_dist_path)}")
# Don't mount - we'll serve via root and catch-all endpoints

# Initialize components with error handling
try:
    pose_analyzer = PoseAnalyzer()
    print("PoseAnalyzer initialized (lazy)")
except Exception as e:
    print(f"PoseAnalyzer init error: {e}")
    pose_analyzer = None

try:
    database = Database()
    print("Database initialized")
except Exception as e:
    print(f"Database init error: {e}")
    database = None

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Pydantic models
class FrameData(BaseModel):
    frame: str  # base64 encoded image
    timestamp: float
    user_id: str
    exercise_type: str

class FeedbackResponse(BaseModel):
    is_correct: bool
    feedback_message: str
    score: float
    corrections: List[str]
    pose_landmarks: Optional[List[dict]]

class SessionEndRequest(BaseModel):
    session_id: str

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str = "patient"

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "patient"
    invite_code: Optional[str] = None
    doctor_id: Optional[str] = None

@app.get("/health")
async def health_check():
    """
    Health check endpoint - always returns 200 for Railway compatibility
    """
    pose_ready = False
    if pose_analyzer:
        try:
            pose_ready = pose_analyzer.is_ready()
        except Exception:
            pose_ready = False
    
    db_ready = False
    if database:
        try:
            db_ready = database.is_connected()
        except Exception:
            db_ready = False
    
    return {
        "status": "healthy" if (pose_ready and db_ready) else "degraded",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "pose_analyzer": pose_ready,
            "database": db_ready
        }
    }


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


@app.post("/auth/register")
async def register(request: RegisterRequest):
    try:
        doctor_id = None
        
        if request.invite_code:
            doctor_id = database.use_invite_code(request.invite_code)
            if not doctor_id:
                raise HTTPException(status_code=400, detail="Invalid or expired invitation code")
        elif request.doctor_id:
            doctor_id = request.doctor_id
            
        user_id = database.create_user(
            request.name, 
            request.email, 
            hash_password(request.password), 
            request.role,
            doctor_id
        )
        
        if doctor_id:
            database.assign_patient_to_doctor(user_id, doctor_id)
        
        return {
            "user_id": user_id,
            "name": request.name,
            "email": request.email,
            "role": request.role,
            "doctor_id": doctor_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/auth/login")
async def login(request: LoginRequest):
    try:
        user = database.authenticate_user(request.email, hash_password(request.password), request.role)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return {
            "user_id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "doctor_id": user.get("doctor_id")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/upload", response_model=FeedbackResponse)
async def upload_frame(frame_data: FrameData):
    """
    Process a single frame for pose analysis
    """
    try:
        # Decode base64 image
        image_data = base64.b64decode(frame_data.frame)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Analyze pose
        result = pose_analyzer.analyze_frame(
            frame, 
            frame_data.exercise_type,
            frame_data.timestamp
        )
        
        # Store session data
        session_id = database.create_session(frame_data.user_id, frame_data.exercise_type)
        session_data = SessionData(
            user_id=frame_data.user_id,
            exercise_type=frame_data.exercise_type,
            timestamp=datetime.fromtimestamp(frame_data.timestamp),
            score=result['score'],
            is_correct=result['is_correct'],
            feedback=result['feedback_message']
        )
        
        database.store_session_data(session_data, session_id)
        
        return FeedbackResponse(**result)
        
    except Exception as e:
        logger.error(f"Error processing frame: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.post("/analyze")
async def analyze_pose(frame_data: FrameData):
    """
    Analyze pose and return detailed feedback
    """
    try:
        # Decode and process frame
        image_data = base64.b64decode(frame_data.frame)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Get detailed analysis
        analysis = pose_analyzer.detailed_analysis(
            frame,
            frame_data.exercise_type,
            frame_data.user_id
        )
        
        return JSONResponse(content=analysis)
        
    except Exception as e:
        logger.error(f"Error in pose analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/progress/{user_id}")
async def get_progress(user_id: str, days: int = 30):
    """
    Get user progress data for the specified number of days
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        progress_data = database.get_user_progress(user_id, start_date, end_date)
        
        return {
            "user_id": user_id,
            "period": f"{days} days",
            "data": progress_data,
            "summary": database.get_progress_summary(user_id, start_date, end_date)
        }
        
    except Exception as e:
        logger.error(f"Error getting progress: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/exercises")
async def get_supported_exercises():
    """
    Get list of supported exercises
    """
    return {
        "exercises": pose_analyzer.get_supported_exercises(),
        "total": len(pose_analyzer.get_supported_exercises())
    }

class ScheduleRequest(BaseModel):
    user_id: str
    exercise_type: str
    scheduled_date: str
    scheduled_time: str

@app.get("/schedule/{user_id}")
async def get_schedule(user_id: str):
    """
    Get all scheduled exercises for a user
    """
    try:
        scheduled = database.get_scheduled_exercises(user_id)
        return scheduled
    except Exception as e:
        logger.error(f"Error getting schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/schedule")
async def create_schedule(request: ScheduleRequest):
    """
    Schedule an exercise for a user
    """
    try:
        scheduled = database.schedule_exercise(request.user_id, request.exercise_type, request.scheduled_date, request.scheduled_time)
        return scheduled
    except Exception as e:
        logger.error(f"Error creating schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/schedule/{schedule_id}/complete")
async def complete_schedule(schedule_id: str):
    """
    Mark a scheduled exercise as completed
    """
    try:
        database.complete_scheduled_exercise(schedule_id)
        return {"status": "completed", "schedule_id": schedule_id}
    except Exception as e:
        logger.error(f"Error completing schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/schedule/{schedule_id}")
async def delete_schedule(schedule_id: str):
    """
    Delete a scheduled exercise
    """
    try:
        database.delete_scheduled_exercise(schedule_id)
        return {"status": "deleted", "schedule_id": schedule_id}
    except Exception as e:
        logger.error(f"Error deleting schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/session/start")
async def start_session(user_id: str, exercise_type: str):
    """
    Start a new therapy session
    """
    try:
        session_id = database.create_session(user_id, exercise_type)
        return {
            "session_id": session_id,
            "user_id": user_id,
            "exercise_type": exercise_type,
            "started_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error starting session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/session/end")
async def end_session(request: SessionEndRequest):
    """
    End a therapy session and generate summary
    """
    try:
        summary = database.end_session(request.session_id)
        return summary
    except Exception as e:
        logger.error(f"Error ending session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/doctor/patients")
async def get_doctor_patients(doctor_id: str):
    """
    Get all patients assigned to a doctor
    """
    try:
        patients = database.get_doctor_patients(doctor_id)
        return {"patients": patients}
    except Exception as e:
        logger.error(f"Error getting patients: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/doctor/patient/{patient_id}/report")
async def get_patient_report(patient_id: str, doctor_id: str):
    """
    Generate comprehensive patient report for doctor
    """
    try:
        report = database.generate_patient_report(patient_id, doctor_id)
        return report
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/doctor/invite")
async def create_invite(doctor_id: str):
    """
    Create an invitation code for a doctor
    """
    try:
        invite_code = database.create_doctor_invite(doctor_id)
        return {"invite_code": invite_code, "doctor_id": doctor_id}
    except Exception as e:
        logger.error(f"Error creating invite: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/doctor/invites/{doctor_id}")
async def get_invites(doctor_id: str):
    """
    Get all invitation codes for a doctor
    """
    try:
        invites = database.get_doctor_invites(doctor_id)
        return {"invites": invites}
    except Exception as e:
        logger.error(f"Error getting invites: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/doctor/assign-patient")
async def assign_patient(patient_id: str, doctor_id: str):
    """
    Assign a patient to a doctor directly
    """
    try:
        database.assign_patient_to_doctor(patient_id, doctor_id)
        return {"status": "success", "patient_id": patient_id, "doctor_id": doctor_id}
    except Exception as e:
        logger.error(f"Error assigning patient: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/doctor/remove-patient")
async def remove_patient(patient_id: str, doctor_id: str):
    """
    Remove a patient from a doctor's care
    """
    try:
        database.remove_patient_from_doctor(patient_id, doctor_id)
        return {"status": "success", "patient_id": patient_id}
    except Exception as e:
        logger.error(f"Error removing patient: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/doctor/search-patients")
async def search_patients(search_term: str = ""):
    """
    Search for patients without a doctor
    """
    try:
        patients = database.find_patients_without_doctor(search_term)
        return {"patients": patients}
    except Exception as e:
        logger.error(f"Error searching patients: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/doctor/therapy-plan")
async def create_therapy_plan(
    patient_id: str = Form(...),
    doctor_id: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    exercises: str = Form(...),
    duration_weeks: int = Form(4)
):
    """Create a therapy plan for a patient"""
    try:
        exercise_list = json.loads(exercises)
        plan_id = database.create_therapy_plan(patient_id, doctor_id, title, description, exercise_list, duration_weeks)
        return {"plan_id": plan_id, "status": "created"}
    except Exception as e:
        logger.error(f"Error creating therapy plan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patient/{patient_id}/therapy-plans")
async def get_patient_therapy_plans(patient_id: str):
    """Get all therapy plans for a patient"""
    try:
        plans = database.get_patient_therapy_plans(patient_id)
        return {"plans": plans}
    except Exception as e:
        logger.error(f"Error getting therapy plans: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/doctor/prescription")
async def create_prescription(
    patient_id: str = Form(...),
    doctor_id: str = Form(...),
    exercise_type: str = Form(...),
    sets: int = Form(...),
    reps: int = Form(...),
    frequency: str = Form(...),
    duration: str = Form(None),
    notes: str = Form(None)
):
    """Create a prescription for a patient"""
    try:
        prescription_id = database.create_prescription(patient_id, doctor_id, exercise_type, sets, reps, frequency, duration, notes)
        return {"prescription_id": prescription_id, "status": "created"}
    except Exception as e:
        logger.error(f"Error creating prescription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patient/{patient_id}/prescriptions")
async def get_patient_prescriptions(patient_id: str):
    """Get all prescriptions for a patient"""
    try:
        prescriptions = database.get_patient_prescriptions(patient_id)
        return {"prescriptions": prescriptions}
    except Exception as e:
        logger.error(f"Error getting prescriptions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/doctor/assigned-session")
async def create_assigned_session(
    patient_id: str = Form(...),
    doctor_id: str = Form(...),
    exercise_type: str = Form(...),
    scheduled_date: str = Form(...),
    scheduled_time: str = Form(...),
    notes: str = Form(None)
):
    """Schedule a session for a patient"""
    try:
        session_id = database.create_assigned_session(patient_id, doctor_id, exercise_type, scheduled_date, scheduled_time, notes)
        return {"session_id": session_id, "status": "scheduled"}
    except Exception as e:
        logger.error(f"Error creating assigned session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/doctor/assigned-sessions/{doctor_id}")
async def get_doctor_assigned_sessions(doctor_id: str):
    """Get all assigned sessions for a doctor's patients"""
    try:
        sessions = database.get_doctor_assigned_sessions(doctor_id)
        return {"sessions": sessions}
    except Exception as e:
        logger.error(f"Error getting assigned sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patient/{patient_id}/assigned-sessions")
async def get_patient_assigned_sessions(patient_id: str):
    """Get all assigned sessions for a patient"""
    try:
        sessions = database.get_patient_assigned_sessions(patient_id)
        return {"sessions": sessions}
    except Exception as e:
        logger.error(f"Error getting assigned sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/doctor/assigned-session/{session_id}/complete")
async def complete_assigned_session(session_id: str):
    """Mark an assigned session as completed"""
    try:
        database.complete_assigned_session(session_id)
        return {"status": "completed"}
    except Exception as e:
        logger.error(f"Error completing session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/doctor/assigned-session/{session_id}")
async def delete_assigned_session(session_id: str):
    """Delete an assigned session"""
    try:
        database.delete_assigned_session(session_id)
        return {"status": "deleted"}
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reports")
async def get_reports(doctor_id: str = None, user_id: str = None):
    """Get saved reports"""
    try:
        reports = database.get_saved_reports(user_id=user_id, doctor_id=doctor_id)
        return {"reports": reports}
    except Exception as e:
        logger.error(f"Error getting reports: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/report/{report_id}")
async def get_report(report_id: int):
    """Get a specific report by ID"""
    try:
        report = database.get_report_by_id(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patient/{user_id}/trend")
async def get_improvement_trend(user_id: str, days: int = 30):
    """Get improvement trend for a user"""
    try:
        trend = database.get_improvement_trend(user_id, days)
        return trend
    except Exception as e:
        logger.error(f"Error getting trend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patient/{user_id}/compliance")
async def get_compliance_rate(user_id: str, days: int = 30):
    """Get compliance rate for a user"""
    try:
        compliance = database.get_compliance_rate(user_id, days)
        return compliance
    except Exception as e:
        logger.error(f"Error getting compliance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time pose analysis
    """
    await manager.connect(websocket)
    try:
        while True:
            # Receive frame data
            data = await websocket.receive_text()
            frame_data = json.loads(data)
            
            # Process frame
            try:
                image_data = base64.b64decode(frame_data['frame'])
                nparr = np.frombuffer(image_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                # Analyze pose
                result = pose_analyzer.analyze_frame(
                    frame,
                    frame_data['exercise_type'],
                    frame_data['timestamp']
                )
                
                # Send feedback
                await manager.send_personal_message(
                    json.dumps(result),
                    websocket
                )
                
            except Exception as e:
                await manager.send_personal_message(
                    json.dumps({"error": str(e)}),
                    websocket
                )
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"User {user_id} disconnected")

@app.get("/favicon.ico")
async def favicon():
    return FileResponse("")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """
    Serve frontend for all non-API routes (SPA support)
    """
    index_path = os.path.join(frontend_dist_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "Frontend not built. Run 'npm run build' in sites/ai-therapy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)