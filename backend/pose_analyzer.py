import cv2
import mediapipe as mp
import numpy as np
from typing import Dict, List, Tuple, Optional
import math
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PoseAnalyzer:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Exercise definitions and thresholds
        self.exercise_configs = {
            "shoulder_raises": {
                "key_angles": ["left_shoulder", "right_shoulder"],
                "target_angles": {"left_shoulder": 90, "right_shoulder": 90},
                "tolerance": 15,
                "min_hold_time": 2.0
            },
            "arm_circles": {
                "key_angles": ["left_shoulder", "right_shoulder"],
                "target_angles": {"left_shoulder": [0, 90, 180, 270], "right_shoulder": [0, 90, 180, 270]},
                "tolerance": 20,
                "min_speed": 0.5
            },
            "wall_pushups": {
                "key_angles": ["left_elbow", "right_elbow"],
                "target_angles": {"left_elbow": [90, 180], "right_elbow": [90, 180]},
                "tolerance": 15,
                "min_reps": 1
            },
            "squats": {
                "key_angles": ["left_knee", "right_knee", "left_hip", "right_hip"],
                "target_angles": {"left_knee": [90, 180], "right_knee": [90, 180]},
                "tolerance": 20,
                "min_depth": 90
            }
        }
        
        self.session_history = {}
        
    def calculate_angle(self, point1: Tuple[float, float], point2: Tuple[float, float], point3: Tuple[float, float]) -> float:
        """
        Calculate angle between three points
        """
        try:
            # Convert to numpy arrays
            a = np.array(point1)
            b = np.array(point2)
            c = np.array(point3)
            
            # Calculate vectors
            ba = a - b
            bc = c - b
            
            # Calculate angle
            cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
            angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
            
            return np.degrees(angle)
        except:
            return 0.0
    
    def extract_landmarks(self, results, frame_shape: tuple = None) -> Dict[str, Tuple[float, float]]:
        """
        Extract key landmarks from MediaPipe results
        """
        if not results.pose_landmarks:
            return {}
        
        landmarks = {}
        h, w = frame_shape if frame_shape else (480, 640)
        
        # Key landmarks for exercises
        landmark_indices = {
            'nose': 0,
            'left_shoulder': 11,
            'right_shoulder': 12,
            'left_elbow': 13,
            'right_elbow': 14,
            'left_wrist': 15,
            'right_wrist': 16,
            'left_hip': 23,
            'right_hip': 24,
            'left_knee': 25,
            'right_knee': 26,
            'left_ankle': 27,
            'right_ankle': 28
        }
        
        for name, idx in landmark_indices.items():
            if idx < len(results.pose_landmarks.landmark):
                landmark = results.pose_landmarks.landmark[idx]
                landmarks[name] = (landmark.x * w, landmark.y * h)
        
        return landmarks
    
    def calculate_exercise_angles(self, landmarks: Dict[str, Tuple[float, float]]) -> Dict[str, float]:
        """
        Calculate relevant angles for exercise analysis
        """
        angles = {}
        
        try:
            # Shoulder angles (arm raise)
            if all(k in landmarks for k in ['left_shoulder', 'left_elbow', 'left_hip']):
                angles['left_shoulder'] = self.calculate_angle(
                    landmarks['left_hip'],
                    landmarks['left_shoulder'],
                    landmarks['left_elbow']
                )
            
            if all(k in landmarks for k in ['right_shoulder', 'right_elbow', 'right_hip']):
                angles['right_shoulder'] = self.calculate_angle(
                    landmarks['right_hip'],
                    landmarks['right_shoulder'],
                    landmarks['right_elbow']
                )
            
            # Elbow angles (push-ups)
            if all(k in landmarks for k in ['left_shoulder', 'left_elbow', 'left_wrist']):
                angles['left_elbow'] = self.calculate_angle(
                    landmarks['left_shoulder'],
                    landmarks['left_elbow'],
                    landmarks['left_wrist']
                )
            
            if all(k in landmarks for k in ['right_shoulder', 'right_elbow', 'right_wrist']):
                angles['right_elbow'] = self.calculate_angle(
                    landmarks['right_shoulder'],
                    landmarks['right_elbow'],
                    landmarks['right_wrist']
                )
            
            # Knee angles (squats)
            if all(k in landmarks for k in ['left_hip', 'left_knee', 'left_ankle']):
                angles['left_knee'] = self.calculate_angle(
                    landmarks['left_hip'],
                    landmarks['left_knee'],
                    landmarks['left_ankle']
                )
            
            if all(k in landmarks for k in ['right_hip', 'right_knee', 'right_ankle']):
                angles['right_knee'] = self.calculate_angle(
                    landmarks['right_hip'],
                    landmarks['right_knee'],
                    landmarks['right_ankle']
                )
            
            # Hip angles
            if all(k in landmarks for k in ['left_shoulder', 'left_hip', 'left_knee']):
                angles['left_hip'] = self.calculate_angle(
                    landmarks['left_shoulder'],
                    landmarks['left_hip'],
                    landmarks['left_knee']
                )
            
            if all(k in landmarks for k in ['right_shoulder', 'right_hip', 'right_knee']):
                angles['right_hip'] = self.calculate_angle(
                    landmarks['right_shoulder'],
                    landmarks['right_hip'],
                    landmarks['right_knee']
                )
                
        except Exception as e:
            logger.error(f"Error calculating angles: {str(e)}")
        
        return angles
    
    def analyze_exercise_form(self, exercise_type: str, angles: Dict[str, float]) -> Dict:
        """
        Analyze exercise form based on calculated angles
        """
        if exercise_type not in self.exercise_configs:
            return {
                "is_correct": False,
                "score": 0.0,
                "feedback_message": f"Exercise type '{exercise_type}' not supported",
                "corrections": []
            }
        
        config = self.exercise_configs[exercise_type]
        corrections = []
        score = 100.0
        
        # Analyze based on exercise type
        if exercise_type == "shoulder_raises":
            return self._analyze_shoulder_raises(angles, config)
        elif exercise_type == "arm_circles":
            return self._analyze_arm_circles(angles, config)
        elif exercise_type == "wall_pushups":
            return self._analyze_wall_pushups(angles, config)
        elif exercise_type == "squats":
            return self._analyze_squats(angles, config)
        
        return {
            "is_correct": True,
            "score": score,
            "feedback_message": "Good form!",
            "corrections": corrections
        }
    
    def _analyze_shoulder_raises(self, angles: Dict[str, float], config: Dict) -> Dict:
        """
        Analyze shoulder raise exercise
        """
        corrections = []
        score = 100.0
        
        target_angle = config["target_angles"]["left_shoulder"]
        tolerance = config["tolerance"]
        
        # Check left shoulder
        if "left_shoulder" in angles:
            left_angle = angles["left_shoulder"]
            if abs(left_angle - target_angle) > tolerance:
                if left_angle < target_angle - tolerance:
                    corrections.append("Raise your left arm higher")
                else:
                    corrections.append("Lower your left arm slightly")
                score -= 25
        
        # Check right shoulder
        if "right_shoulder" in angles:
            right_angle = angles["right_shoulder"]
            if abs(right_angle - target_angle) > tolerance:
                if right_angle < target_angle - tolerance:
                    corrections.append("Raise your right arm higher")
                else:
                    corrections.append("Lower your right arm slightly")
                score -= 25
        
        # Check symmetry
        if "left_shoulder" in angles and "right_shoulder" in angles:
            angle_diff = abs(angles["left_shoulder"] - angles["right_shoulder"])
            if angle_diff > 20:
                corrections.append("Keep both arms at the same height")
                score -= 20
        
        is_correct = len(corrections) == 0
        feedback_message = "Perfect shoulder raises!" if is_correct else "Adjust your form"
        
        return {
            "is_correct": is_correct,
            "score": max(0, score),
            "feedback_message": feedback_message,
            "corrections": corrections
        }
    
    def _analyze_wall_pushups(self, angles: Dict[str, float], config: Dict) -> Dict:
        """
        Analyze wall push-up exercise
        """
        corrections = []
        score = 100.0
        
        # Check elbow angles
        for side in ["left", "right"]:
            elbow_key = f"{side}_elbow"
            if elbow_key in angles:
                elbow_angle = angles[elbow_key]
                
                # During push-up, elbow should be between 90-120 degrees
                if elbow_angle < 80:
                    corrections.append(f"Bend your {side} elbow more")
                    score -= 20
                elif elbow_angle > 160:
                    corrections.append(f"Keep your {side} arm bent")
                    score -= 15
        
        is_correct = len(corrections) == 0
        feedback_message = "Great push-up form!" if is_correct else "Adjust your arm position"
        
        return {
            "is_correct": is_correct,
            "score": max(0, score),
            "feedback_message": feedback_message,
            "corrections": corrections
        }
    
    def _analyze_squats(self, angles: Dict[str, float], config: Dict) -> Dict:
        """
        Analyze squat exercise
        """
        corrections = []
        score = 100.0
        
        # Check knee angles
        for side in ["left", "right"]:
            knee_key = f"{side}_knee"
            if knee_key in angles:
                knee_angle = angles[knee_key]
                
                # Good squat: knees should be around 90 degrees at bottom
                if knee_angle > 120:
                    corrections.append("Squat deeper")
                    score -= 25
                elif knee_angle < 70:
                    corrections.append("Don't squat too deep")
                    score -= 15
        
        # Check hip angles for proper form
        if "left_hip" in angles and "right_hip" in angles:
            avg_hip_angle = (angles["left_hip"] + angles["right_hip"]) / 2
            if avg_hip_angle > 160:
                corrections.append("Bend at the hips more")
                score -= 20
        
        is_correct = len(corrections) == 0
        feedback_message = "Excellent squat form!" if is_correct else "Improve your squat depth and form"
        
        return {
            "is_correct": is_correct,
            "score": max(0, score),
            "feedback_message": feedback_message,
            "corrections": corrections
        }
    
    def _analyze_arm_circles(self, angles: Dict[str, float], config: Dict) -> Dict:
        """
        Analyze arm circle exercise
        """
        corrections = []
        score = 100.0
        
        # For arm circles, we need to track movement over time
        # This is a simplified version
        for side in ["left", "right"]:
            shoulder_key = f"{side}_shoulder"
            if shoulder_key in angles:
                shoulder_angle = angles[shoulder_key]
                
                # Arms should be extended (around 90 degrees from body)
                if shoulder_angle < 70:
                    corrections.append(f"Extend your {side} arm more")
                    score -= 20
                elif shoulder_angle > 110:
                    corrections.append(f"Keep your {side} arm at shoulder level")
                    score -= 15
        
        is_correct = len(corrections) == 0
        feedback_message = "Good arm circles!" if is_correct else "Maintain proper arm extension"
        
        return {
            "is_correct": is_correct,
            "score": max(0, score),
            "feedback_message": feedback_message,
            "corrections": corrections
        }
    
    def analyze_frame(self, frame: np.ndarray, exercise_type: str, timestamp: float) -> Dict:
        """
        Main analysis function for a single frame
        """
        try:
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            results = self.pose.process(rgb_frame)
            
            if not results.pose_landmarks:
                return {
                    "is_correct": False,
                    "score": 0.0,
                    "feedback_message": "No pose detected. Make sure you're visible in the camera.",
                    "corrections": ["Position yourself in front of the camera"],
                    "pose_landmarks": None
                }
            
            # Extract landmarks
            landmarks = self.extract_landmarks(results, (frame.shape[0], frame.shape[1]))
            
            # Calculate angles
            angles = self.calculate_exercise_angles(landmarks)
            
            # Analyze exercise form
            analysis = self.analyze_exercise_form(exercise_type, angles)
            
            # Add pose landmarks to response
            analysis["pose_landmarks"] = [
                {"x": lm.x, "y": lm.y, "z": lm.z, "visibility": lm.visibility}
                for lm in results.pose_landmarks.landmark
            ]
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing frame: {str(e)}")
            return {
                "is_correct": False,
                "score": 0.0,
                "feedback_message": f"Analysis error: {str(e)}",
                "corrections": [],
                "pose_landmarks": None
            }
    
    def detailed_analysis(self, frame: np.ndarray, exercise_type: str, user_id: str) -> Dict:
        """
        Provide detailed analysis with additional metrics
        """
        basic_analysis = self.analyze_frame(frame, exercise_type, 0.0)
        
        # Add detailed metrics
        detailed_result = {
            **basic_analysis,
            "timestamp": datetime.now().isoformat(),
            "exercise_type": exercise_type,
            "user_id": user_id,
            "confidence": 0.95 if basic_analysis["pose_landmarks"] else 0.0,
            "recommendations": self._get_exercise_recommendations(exercise_type, basic_analysis)
        }
        
        return detailed_result
    
    def _get_exercise_recommendations(self, exercise_type: str, analysis: Dict) -> List[str]:
        """
        Get personalized recommendations based on analysis
        """
        recommendations = []
        
        if not analysis["is_correct"]:
            recommendations.extend(analysis["corrections"])
        
        # Add general recommendations
        if exercise_type == "shoulder_raises":
            recommendations.append("Keep your core engaged throughout the movement")
            recommendations.append("Move slowly and controlled")
        elif exercise_type == "wall_pushups":
            recommendations.append("Keep your body in a straight line")
            recommendations.append("Control the movement on both push and return")
        elif exercise_type == "squats":
            recommendations.append("Keep your weight on your heels")
            recommendations.append("Don't let your knees cave inward")
        
        return recommendations
    
    def get_supported_exercises(self) -> List[str]:
        """
        Get list of supported exercises
        """
        return list(self.exercise_configs.keys())
    
    def is_ready(self) -> bool:
        """
        Check if the pose analyzer is ready
        """
        return self.pose is not None