from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any

class SessionData(BaseModel):
    user_id: str
    exercise_type: str
    timestamp: datetime
    score: float
    is_correct: bool
    feedback: str
    corrections: Optional[List[str]] = []

class ExerciseResult(BaseModel):
    user_id: str
    exercise_type: str
    date: datetime
    total_sessions: int
    total_duration_minutes: float
    average_score: float
    improvement_rate: float

class ProgressReport(BaseModel):
    user_id: str
    doctor_id: Optional[str]
    report_date: datetime
    summary: Dict[str, Any]
    progress_data: List[Dict[str, Any]]
    recommendations: List[str]

class User(BaseModel):
    id: str
    name: str
    email: str
    role: str = "patient"
    doctor_id: Optional[str] = None
    created_at: datetime

class Session(BaseModel):
    id: str
    user_id: str
    exercise_type: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    total_frames: int = 0
    average_score: float = 0.0
    status: str = "active"

class PoseAnalysisResult(BaseModel):
    is_correct: bool
    score: float
    feedback_message: str
    corrections: List[str]
    pose_landmarks: Optional[List[Dict[str, float]]] = None
    confidence: float = 0.0
    timestamp: str
    exercise_type: str
    user_id: str

class DoctorPatient(BaseModel):
    doctor_id: str
    patient_id: str
    assigned_at: datetime
    status: str = "active"

class WebSocketMessage(BaseModel):
    type: str  # "frame", "feedback", "error"
    data: Dict[str, Any]
    timestamp: str
    user_id: str