const API_URL = (() => {
  if (typeof window === 'undefined') return 'http://localhost:8000';
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  return window.location.origin;
})();

async function callBackend(method: string, path: string, body?: any): Promise<any> {
  const headers: Record<string, string> = {};
  let requestBody: BodyInit | undefined;

  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || 'API call failed');
  }

  return response.json();
}

export interface ExerciseConfig {
  id: string;
  name: string;
  sets: number;
  reps: number;
  duration?: number;
  description: string;
}

export interface SessionResult {
  is_correct: boolean;
  score: number;
  feedback_message: string;
  corrections: string[];
  pose_landmarks?: Array<{x: number; y: number; z: number; visibility: number}>;
}

export interface ScheduledExercise {
  id: string;
  exercise_type: string;
  scheduled_date: string;
  scheduled_time: string;
  completed: boolean;
  completed_at?: string;
}

export interface ExerciseBreakdown {
  exercise_type: string;
  frame_count: number;
  average_score: number;
  accuracy_rate: number;
}

export interface ProgressSummary {
  active_days: number;
  total_frames: number;
  overall_average_score: number;
  overall_accuracy: number;
  exercise_breakdown: ExerciseBreakdown[];
}

export interface ProgressData {
  user_id: string;
  period: string;
  data: Array<{ date: string; exercise_type: string; session_count: number; average_score: number; accuracy_rate: number }>;
  summary: ProgressSummary;
}

export interface SessionSummary {
  session_id: string;
  duration_seconds: number;
  total_frames: number;
  average_score: number;
  status: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  created_at: string;
  assigned_at: string;
  status: string;
  total_sessions: number;
  average_score: number;
}

export interface PatientReport {
  patient_info: {
    id: string;
    name: string;
    email: string;
    created_at: string;
  };
  report_period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  summary: ProgressSummary;
  progress_data: Array<{ date: string; exercise_type: string; session_count: number; average_score: number; accuracy_rate: number }>;
  recent_sessions: Array<{
    exercise_type: string;
    started_at: string;
    ended_at: string;
    duration_seconds: number;
    average_score: number;
    total_frames: number;
  }>;
  generated_at: string;
  generated_by: string;
}

export interface AssignedSession {
  id: string;
  patient_id: string;
  patient_name?: string;
  doctor_id: string;
  exercise_type: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  exercise_type: string;
  sets: number;
  reps: number;
  frequency: string;
  duration?: string;
  notes?: string;
  status: string;
  prescribed_at: string;
}

export interface TherapyPlan {
  id: string;
  patient_id: string;
  doctor_id: string;
  title: string;
  description: string;
  exercises: string[];
  duration_weeks: number;
  status: string;
  created_at: string;
}

export interface SavedReport {
  id: number;
  user_id: string;
  doctor_id: string;
  report_date: string;
  created_at: string;
  patient_name: string;
  doctor_name: string;
}

export interface ImprovementTrend {
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data' | 'error';
  change: number;
  first_week_avg?: number;
  last_week_avg?: number;
  data_points?: number;
}

export interface ComplianceRate {
  total_scheduled: number;
  completed: number;
  compliance_rate: number;
}

export const api = {
  async analyzeFrame(frame: string, timestamp: number, userId: string, exerciseType: string): Promise<SessionResult> {
    return callBackend('POST', '/upload', {
      frame,
      timestamp,
      user_id: userId,
      exercise_type: exerciseType,
    });
  },

  async startSession(userId: string, exerciseType: string): Promise<{ session_id: string }> {
    return callBackend('POST', `/session/start?user_id=${userId}&exercise_type=${exerciseType}`);
  },

  async endSession(sessionId: string): Promise<SessionSummary> {
    return callBackend('POST', '/session/end', { session_id });
  },

  async getProgress(userId: string, days: number = 30): Promise<ProgressData> {
    return callBackend('GET', `/progress/${userId}?days=${days}`);
  },

  async getExercises(): Promise<{ exercises: string[]; total: number }> {
    return callBackend('GET', '/exercises');
  },

  async getScheduledExercises(userId: string): Promise<ScheduledExercise[]> {
    const response = await fetch(`${API_URL}/schedule/${userId}`);

    if (!response.ok) {
      return [];
    }

    return response.json();
  },

  async scheduleExercise(userId: string, exerciseType: string, date: string, time: string): Promise<ScheduledExercise> {
    return callBackend('POST', '/schedule', {
      user_id: userId,
      exercise_type: exerciseType,
      scheduled_date: date,
      scheduled_time: time,
    });
  },

  async completeScheduledExercise(scheduleId: string): Promise<void> {
    return callBackend('POST', `/schedule/${scheduleId}/complete`);
  },

  async getDoctorPatients(doctorId: string): Promise<Patient[]> {
    const result = await callBackend('GET', `/doctor/patients?doctor_id=${doctorId}`);
    return result.patients;
  },

  async getPatientReport(patientId: string, doctorId: string): Promise<PatientReport> {
    return callBackend('GET', `/doctor/patient/${patientId}/report?doctor_id=${doctorId}`);
  },

  async getDoctorAssignedSessions(doctorId: string): Promise<AssignedSession[]> {
    const result = await callBackend('GET', `/doctor/assigned-sessions/${doctorId}`);
    return result.sessions;
  },

  async createAssignedSession(
    patientId: string,
    doctorId: string,
    exerciseType: string,
    scheduledDate: string,
    scheduledTime: string,
    notes?: string
  ): Promise<{ session_id: string }> {
    return callBackend('POST', '/doctor/assigned-session', {
      patient_id: patientId,
      doctor_id: doctorId,
      exercise_type: exerciseType,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      notes: notes || '',
    });
  },

  async completeAssignedSession(sessionId: string): Promise<void> {
    return callBackend('POST', `/doctor/assigned-session/${sessionId}/complete`);
  },

  async deleteAssignedSession(sessionId: string): Promise<void> {
    return callBackend('DELETE', `/doctor/assigned-session/${sessionId}`);
  },

  async getPatientPrescriptions(patientId: string): Promise<Prescription[]> {
    const response = await fetch(`${API_URL}/patient/${patientId}/prescriptions`);

    if (!response.ok) {
      throw new Error('Failed to get prescriptions');
    }

    const data = await response.json();
    return data.prescriptions;
  },

  async createPrescription(
    patientId: string,
    doctorId: string,
    exerciseType: string,
    sets: number,
    reps: number,
    frequency: string,
    duration?: string,
    notes?: string
  ): Promise<{ prescription_id: string }> {
    const formData = new FormData();
    formData.append('patient_id', patientId);
    formData.append('doctor_id', doctorId);
    formData.append('exercise_type', exerciseType);
    formData.append('sets', sets.toString());
    formData.append('reps', reps.toString());
    formData.append('frequency', frequency);
    if (duration) formData.append('duration', duration);
    if (notes) formData.append('notes', notes);

    const response = await fetch(`${API_URL}/doctor/prescription`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to create prescription');
    }

    return response.json();
  },

  async getPatientTherapyPlans(patientId: string): Promise<TherapyPlan[]> {
    const response = await fetch(`${API_URL}/patient/${patientId}/therapy-plans`);

    if (!response.ok) {
      throw new Error('Failed to get therapy plans');
    }

    const data = await response.json();
    return data.plans;
  },

  async createTherapyPlan(
    patientId: string,
    doctorId: string,
    title: string,
    description: string,
    exercises: string[],
    durationWeeks: number
  ): Promise<{ plan_id: string }> {
    return callBackend('POST', '/doctor/therapy-plan', {
      patient_id: patientId,
      doctor_id: doctorId,
      title,
      description,
      exercises: JSON.stringify(exercises),
      duration_weeks: durationWeeks,
    });
  },

  async checkHealth(): Promise<{ status: string; services: { pose_analyzer: boolean; database: boolean } }> {
    return callBackend('GET', '/health');
  },

  async getReports(doctorId?: string, userId?: string): Promise<SavedReport[]> {
    let path = '/reports?';
    if (doctorId) path += `doctor_id=${doctorId}&`;
    if (userId) path += `user_id=${userId}&`;
    const result = await callBackend('GET', path);
    return result.reports;
  },

  async getImprovementTrend(userId: string, days: number = 30): Promise<ImprovementTrend> {
    return callBackend('GET', `/patient/${userId}/trend?days=${days}`);
  },

  async getComplianceRate(userId: string, days: number = 30): Promise<ComplianceRate> {
    return callBackend('GET', `/patient/${userId}/compliance?days=${days}`);
  },

  createWebSocket(userId: string): WebSocket | null {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;

    try {
      return new WebSocket(`${protocol}://${host}/ws/${userId}`);
    } catch {
      return null;
    }
  },
};

export const exerciseConfigs: Record<string, ExerciseConfig> = {
  '1': { id: '1', name: 'Shoulder Raises', sets: 3, reps: 15, description: 'Raise arms to shoulder level' },
  '2': { id: '2', name: 'Arm Circles', sets: 2, reps: 20, description: 'Circular arm movements' },
  '3': { id: '3', name: 'Wall Push-ups', sets: 3, reps: 10, description: 'Push-ups against wall' },
  '4': { id: '4', name: 'Squats', sets: 3, reps: 12, description: 'Full squat movement' },
};

export const backendExerciseMap: Record<string, string> = {
  '1': 'shoulder_raises',
  '2': 'arm_circles',
  '3': 'wall_pushups',
  '4': 'squats',
};

export const reverseExerciseMap: Record<string, string> = {
  'shoulder_raises': '1',
  'arm_circles': '2',
  'wall_pushups': '3',
  'squats': '4',
};

export interface ExerciseDemo {
  id: string;
  name: string;
  type: string;
  description: string;
  targetAngle: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  benefits: string[];
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
  muscleGroups: string[];
}

export const exerciseDemos: Record<string, ExerciseDemo> = {
  shoulder_raises: {
    id: 'shoulder_raises',
    name: 'Shoulder Raises',
    type: 'shoulder_raises',
    description: 'Raise your arms to shoulder level to strengthen shoulder muscles and improve range of motion.',
    targetAngle: '90°',
    duration: '15 reps × 3 sets',
    difficulty: 'Beginner',
    benefits: ['Strengthens deltoid muscles', 'Improves shoulder mobility', 'Reduces shoulder pain', 'Enhances posture'],
    instructions: [
      'Stand with feet shoulder-width apart',
      'Keep your back straight and core engaged',
      'Raise both arms out to the sides',
      'Lift until arms reach shoulder height (90°)',
      'Pause briefly at the top',
      'Lower slowly back to starting position',
      'Repeat for desired reps'
    ],
    tips: ['Move slowly and controlled', 'Avoid swinging', 'Keep shoulders down, not up by ears', 'Breathe steadily'],
    commonMistakes: ['Raising arms too high (above 90°)', 'Swinging the arms', 'Shrugging shoulders up', 'Bending elbows significantly'],
    muscleGroups: ['Deltoids', 'Trapezius', 'Rotator Cuff']
  },
  arm_circles: {
    id: 'arm_circles',
    name: 'Arm Circles',
    type: 'arm_circles',
    description: 'Circular arm movements to warm up shoulders and improve joint mobility.',
    targetAngle: '90°',
    duration: '20 reps × 2 sets',
    difficulty: 'Beginner',
    benefits: ['Warms up shoulder joints', 'Improves circulation', 'Increases range of motion', 'Prepares for heavier exercises'],
    instructions: [
      'Stand with feet shoulder-width apart',
      'Extend arms out to the sides at shoulder height',
      'Keep arms straight but not locked',
      'Make small circular motions forward',
      'After 10 reps, reverse direction',
      'Maintain steady breathing throughout'
    ],
    tips: ['Start with small circles', 'Gradually increase circle size', 'Keep core stable', 'Keep shoulders down'],
    commonMistakes: ['Making circles too big too soon', 'Bending elbows', 'Using momentum instead of muscles', 'Holding breath'],
    muscleGroups: ['Deltoids', 'Rotator Cuff', 'Trapezius']
  },
  wall_pushups: {
    id: 'wall_pushups',
    name: 'Wall Push-ups',
    type: 'wall_pushups',
    description: 'Push-ups against a wall to build upper body strength with reduced strain.',
    targetAngle: '90-120°',
    duration: '10 reps × 3 sets',
    difficulty: 'Beginner',
    benefits: ['Builds chest and tricep strength', 'Low impact on joints', 'Improves posture', 'Can be done anywhere'],
    instructions: [
      'Stand facing a wall, arm\'s length away',
      'Place hands on wall at shoulder height',
      'Keep body in a straight line from head to heels',
      'Bend elbows to bring chest toward wall',
      'Push back to starting position',
      'Keep core tight throughout'
    ],
    tips: ['Keep your body straight', 'Don\'t lock elbows at top', 'Move slowly for more benefit', 'Increase difficulty by stepping closer'],
    commonMistakes: ['Letting hips sag', 'Getting too close to wall', 'Not bending elbows enough', 'Holding breath'],
    muscleGroups: ['Pectorals', 'Triceps', 'Deltoids', 'Core']
  },
  squats: {
    id: 'squats',
    name: 'Squats',
    type: 'squats',
    description: 'Full squat movement to strengthen legs and improve lower body mobility.',
    targetAngle: '90° at knees',
    duration: '12 reps × 3 sets',
    difficulty: 'Intermediate',
    benefits: ['Strengthens quadriceps and glutes', 'Improves balance', 'Enhances hip mobility', 'Boosts metabolism'],
    instructions: [
      'Stand with feet shoulder-width apart',
      'Keep chest up and back straight',
      'Bend knees and push hips back',
      'Lower until thighs are parallel to floor',
      'Keep knees over toes, not past them',
      'Push through heels to stand',
      'Squeeze glutes at the top'
    ],
    tips: ['Keep weight on heels', 'Don\'t let knees cave inward', 'Look forward, not down', 'Engage core throughout'],
    commonMistakes: ['Letting knees go past toes', 'Rounding the back', 'Rising only halfway', 'Putting weight on toes'],
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core']
  }
};
