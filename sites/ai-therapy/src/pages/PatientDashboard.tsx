import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Target, TrendingUp, Award, Play, LogOut, Calendar, Dumbbell, Info, CheckCircle, AlertCircle, BookOpen, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, exerciseConfigs, ProgressData, exerciseDemos, ExerciseDemo, AssignedSession, Prescription } from '../services/api';

// Helper function to get API URL
const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  return '/api';
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [assignedSessions, setAssignedSessions] = useState<AssignedSession[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'prescriptions' | 'library'>('today');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<ExerciseDemo | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadPatientData();
  }, [user]);

  const loadPatientData = async () => {
    if (!user?.id) return;
    try {
      const [progress, sessions, rx] = await Promise.all([
        api.getProgress(user.id, 30).catch(() => null),
        fetch(`${getApiUrl()}/patient/${user.id}/assigned-sessions`).then(r => r.json()).then(d => d.sessions || []).catch(() => []),
        fetch(`${getApiUrl()}/patient/${user.id}/prescriptions`).then(r => r.json()).then(d => d.prescriptions || []).catch(() => [])
      ]);
      setProgressData(progress);
      setAssignedSessions(sessions);
      setPrescriptions(rx);
    } catch {
      // Silently fail
    }
  };

  const getTodaySessions = () => {
    const today = new Date().toISOString().split('T')[0];
    return assignedSessions.filter(s => s.scheduled_date === today && s.status === 'scheduled');
  };

  const getExerciseDemo = (type: string): ExerciseDemo | undefined => {
    return exerciseDemos[type];
  };

  const openDemo = (type: string) => {
    const demo = getExerciseDemo(type);
    if (demo) {
      setSelectedDemo(demo);
      setShowDemoModal(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const stats = progressData?.summary || {
    overall_average_score: 0,
    total_frames: 0,
    overall_accuracy: 0,
    active_days: 0,
  };

  const todaySessions = getTodaySessions();
  const allExercises = Object.values(exerciseConfigs);

  const getExerciseLabel = (type: string) => {
    return exerciseDemos[type]?.name || type;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Modal */}
      {showDemoModal && selectedDemo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">{selectedDemo.name}</h2>
              <button onClick={() => setShowDemoModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Demo Video Placeholder */}
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Video className="h-16 w-16 text-indigo-400 mx-auto mb-2" />
                  <p className="text-indigo-600 font-medium">Exercise Demo Video</p>
                  <p className="text-sm text-indigo-400">AI will track your form</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedDemo.targetAngle}</p>
                  <p className="text-sm text-blue-600">Target Angle</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedDemo.duration}</p>
                  <p className="text-sm text-green-600">Duration</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{selectedDemo.difficulty}</p>
                  <p className="text-sm text-purple-600">Difficulty</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{selectedDemo.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Muscle Groups</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDemo.muscleGroups.map(muscle => (
                    <span key={muscle} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{muscle}</span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Benefits</h3>
                <ul className="space-y-1">
                  {selectedDemo.benefits.map(benefit => (
                    <li key={benefit} className="flex items-center text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />{benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Instructions</h3>
                <ol className="space-y-2">
                  {selectedDemo.instructions.map((inst, i) => (
                    <li key={i} className="flex items-start text-gray-600">
                      <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0">{i+1}</span>
                      {inst}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Tips</h3>
                <ul className="space-y-1">
                  {selectedDemo.tips.map(tip => (
                    <li key={tip} className="flex items-center text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />{tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Common Mistakes</h3>
                <ul className="space-y-1">
                  {selectedDemo.commonMistakes.map(mistake => (
                    <li key={mistake} className="flex items-center text-gray-600">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />{mistake}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => {
                  setShowDemoModal(false);
                  navigate(`/exercise/${selectedDemo.id === 'shoulder_raises' ? '1' : selectedDemo.id === 'arm_circles' ? '2' : selectedDemo.id === 'wall_pushups' ? '3' : '4'}`);
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Exercise
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <span className="text-xl font-bold text-gray-900">TherapyAI</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user?.name || 'User'}</span>
            <button onClick={handleLogout} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
              <p className="text-blue-100">
                {todaySessions.length > 0 
                  ? `You have ${todaySessions.length} exercise${todaySessions.length > 1 ? 's' : ''} scheduled today`
                  : 'No exercises scheduled - check the library!'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{stats.active_days || 1}</div>
              <div className="text-blue-100">Day {stats.active_days || 1}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <Target className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{Math.round(stats.overall_average_score)}%</span>
            </div>
            <p className="text-gray-600 font-medium mt-2">Form Accuracy</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <Clock className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{Math.round(stats.total_frames / 60)}m</span>
            </div>
            <p className="text-gray-600 font-medium mt-2">Total Time</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">+{Math.max(0, Math.round(stats.overall_accuracy - 70))}%</span>
            </div>
            <p className="text-gray-600 font-medium mt-2">Improvement</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <Award className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{stats.active_days}</span>
            </div>
            <p className="text-gray-600 font-medium mt-2">Active Days</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          {[
            { id: 'today', label: "Today's Workouts", icon: Calendar },
            { id: 'prescriptions', label: 'Prescriptions', icon: Dumbbell },
            { id: 'library', label: 'Exercise Library', icon: BookOpen },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'today' | 'prescriptions' | 'library')}
              className={`flex items-center px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Today's Workouts Tab */}
        {activeTab === 'today' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Today's Scheduled Exercises</h2>
              {todaySessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No exercises scheduled for today</p>
                  <p className="text-sm">Check the Exercise Library to practice</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Dumbbell className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{getExerciseLabel(session.exercise_type)}</p>
                          <p className="text-sm text-gray-500">{session.scheduled_time}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/exercise/${session.exercise_type === 'shoulder_raises' ? '1' : session.exercise_type === 'arm_circles' ? '2' : session.exercise_type === 'wall_pushups' ? '3' : '4'}`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Progress This Week</h2>
              <div className="h-48 flex items-end justify-between space-x-2">
                {(progressData?.data || []).length > 0 ? progressData!.data.slice(0, 7).map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                      style={{ height: `${item.average_score}%` }}
                    />
                    <span className="text-xs text-gray-500 mt-2">{item.date?.slice(5) || ''}</span>
                  </div>
                )) : [65, 72, 68, 78, 82, 75, 85].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t" style={{ height: `${h}%` }} />
                    <span className="text-xs text-gray-500 mt-2">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-green-700 font-medium">Keep it up! You're improving!</p>
              </div>
            </div>
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Your Prescriptions</h2>
            </div>
            {prescriptions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Dumbbell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No prescriptions from your doctor yet</p>
                <p className="text-sm">Your doctor will assign exercises here</p>
              </div>
            ) : (
              <div className="divide-y">
                {prescriptions.map(rx => (
                  <div key={rx.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Dumbbell className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{getExerciseLabel(rx.exercise_type)}</p>
                        <p className="text-sm text-gray-500">{rx.sets} sets × {rx.reps} reps • {rx.frequency}</p>
                        {rx.duration && <p className="text-xs text-gray-400">Duration: {rx.duration}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/exercise/${rx.exercise_type === 'shoulder_raises' ? '1' : rx.exercise_type === 'arm_circles' ? '2' : rx.exercise_type === 'wall_pushups' ? '3' : '4'}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Start
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Exercise Library Tab */}
        {activeTab === 'library' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allExercises.map(exercise => {
              const demo = getExerciseDemo(exercise.id === '1' ? 'shoulder_raises' : exercise.id === '2' ? 'arm_circles' : exercise.id === '3' ? 'wall_pushups' : 'squats');
              return (
                <div key={exercise.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                    <Video className="h-12 w-12 text-indigo-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{exercise.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{exercise.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">{demo?.difficulty}</span>
                      <button
                        onClick={() => openDemo(exercise.id === '1' ? 'shoulder_raises' : exercise.id === '2' ? 'arm_circles' : exercise.id === '3' ? 'wall_pushups' : 'squats')}
                        className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        How to do it
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientDashboard;
