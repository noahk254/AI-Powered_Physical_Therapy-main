import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Activity, AlertTriangle, Calendar, LogOut, Search, 
  CheckCircle, Plus, Copy, X, UserPlus, Pill, Play, Check, Trash2,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, Patient, AssignedSession } from '../services/api';

interface UnassignedPatient {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface DoctorInvite {
  doctor_id: string;
  invite_code: string;
  created_at: string;
  used: boolean;
}

const exerciseTypes = [
  { value: 'shoulder_raises', label: 'Shoulder Raises' },
  { value: 'arm_circles', label: 'Arm Circles' },
  { value: 'wall_pushups', label: 'Wall Push-ups' },
  { value: 'squats', label: 'Squats' },
];

const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice_daily', label: 'Twice Daily' },
  { value: '3_times_week', label: '3 Times per Week' },
  { value: '5_times_week', label: '5 Times per Week' },
];

const API_BASE = (() => {
  if (typeof window === 'undefined') return 'http://localhost:8000';
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  return window.location.origin;
})();

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'prescriptions'>('overview');
  
  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [invites, setInvites] = useState<DoctorInvite[]>([]);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [unassignedPatients, setUnassignedPatients] = useState<UnassignedPatient[]>([]);
  
  // Schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPatientForSchedule, setSelectedPatientForSchedule] = useState<Patient | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleExercise, setScheduleExercise] = useState('shoulder_raises');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [assignedSessions, setAssignedSessions] = useState<AssignedSession[]>([]);
  
  // Prescription modal
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState<Patient | null>(null);
  const [prescriptionExercise, setPrescriptionExercise] = useState('shoulder_raises');
  const [prescriptionSets, setPrescriptionSets] = useState(3);
  const [prescriptionReps, setPrescriptionReps] = useState(10);
  const [prescriptionFrequency, setPrescriptionFrequency] = useState('daily');
  const [prescriptionDuration, setPrescriptionDuration] = useState('4 weeks');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'doctor') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const [patientsData, sessionsData, invitesData] = await Promise.all([
        api.getDoctorPatients(user.id),
        api.getDoctorAssignedSessions(user.id),
        fetch(`${API_BASE}/doctor/invites/${user.id}`).then(r => r.json())
      ]);
      setPatients(patientsData);
      setAssignedSessions(sessionsData);
      setInvites(invitesData.invites || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateInvite = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE}/doctor/invite?doctor_id=${user.id}`, {
        method: 'POST'
      });
      const data = await response.json();
      setInviteCode(data.invite_code);
      loadData();
    } catch (err) {
      console.error('Failed to generate invite:', err);
    }
  };

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const searchUnassignedPatients = async () => {
    try {
      const response = await fetch(`${API_BASE}/doctor/search-patients?search_term=${encodeURIComponent(patientSearch)}`);
      const data = await response.json();
      setUnassignedPatients(data.patients || []);
    } catch (err) {
      console.error('Failed to search patients:', err);
    }
  };

  const assignPatient = async (patientId: string) => {
    if (!user?.id) return;
    try {
      await fetch(`${API_BASE}/doctor/assign-patient?patient_id=${patientId}&doctor_id=${user.id}`, {
        method: 'POST'
      });
      loadData();
      setShowAddPatientModal(false);
      setPatientSearch('');
      setUnassignedPatients([]);
    } catch (err) {
      console.error('Failed to assign patient:', err);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedPatientForSchedule) return;
    
    try {
      await api.createAssignedSession(
        selectedPatientForSchedule.id,
        user.id,
        scheduleExercise,
        scheduleDate,
        scheduleTime,
        scheduleNotes
      );
      loadData();
      setShowScheduleModal(false);
      setSelectedPatientForSchedule(null);
      setScheduleNotes('');
    } catch (err) {
      console.error('Failed to schedule session:', err);
    }
  };

  const handlePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedPatientForPrescription) return;
    
    try {
      await api.createPrescription(
        selectedPatientForPrescription.id,
        user.id,
        prescriptionExercise,
        prescriptionSets,
        prescriptionReps,
        prescriptionFrequency,
        prescriptionDuration,
        prescriptionNotes
      );
      loadData();
      setShowPrescriptionModal(false);
      setSelectedPatientForPrescription(null);
      setPrescriptionNotes('');
    } catch (err) {
      console.error('Failed to create prescription:', err);
    }
  };

  const completeSession = async (sessionId: string) => {
    try {
      await api.completeAssignedSession(sessionId);
      loadData();
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await api.deleteAssignedSession(sessionId);
      loadData();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const calculateStats = () => {
    const totalPatients = patients.length;
    const avgScore = totalPatients > 0 
      ? patients.reduce((sum, p) => sum + (p.average_score || 0), 0) / totalPatients 
      : 0;
    const needAttention = patients.filter(p => (p.average_score || 0) < 60).length;
    const scheduledToday = assignedSessions.filter(s => 
      s.scheduled_date === new Date().toISOString().split('T')[0] && s.status === 'scheduled'
    ).length;

    return {
      totalPatients,
      complianceRate: Math.round(avgScore),
      needAttention,
      scheduledToday,
      avgScore: Math.round(avgScore)
    };
  };

  const stats = calculateStats();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getExerciseLabel = (value: string) => exerciseTypes.find(e => e.value === value)?.label || value;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <span className="text-xl font-bold text-gray-900">TherapyAI</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Dr. {user?.name?.split(' ').pop() || 'User'}</span>
            <button onClick={handleLogout} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Dr. {user?.name?.split(' ')[0] || 'User'}'s Dashboard</h1>
              <p className="text-indigo-100">Managing {stats.totalPatients} patients</p>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => setShowAddPatientModal(true)} className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Patient
              </button>
              <button onClick={() => setShowInviteModal(true)} className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 flex items-center">
                <Copy className="h-4 w-4 mr-2" />
                Invite Code
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: Users },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'schedule' | 'prescriptions')}
              className={`flex items-center px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{stats.totalPatients}</span>
            </div>
            <p className="text-gray-600 font-medium mt-2">Total Patients</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <Activity className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.complianceRate}%</span>
            </div>
            <p className="text-gray-600 font-medium mt-2">Avg. Compliance</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <Calendar className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{stats.scheduledToday}</span>
            </div>
            <p className="text-gray-600 font-medium mt-2">Sessions Today</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">{stats.needAttention}</span>
            </div>
            <p className="text-gray-600 font-medium mt-2">Need Attention</p>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Patients</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No patients found</div>
                ) : (
                  filteredPatients.map((patient) => (
                    <div key={patient.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {patient.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{patient.name}</p>
                            <p className="text-sm text-gray-500">{patient.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="font-medium">{patient.average_score || 0}%</p>
                            <p className="text-xs text-gray-500">{patient.total_sessions || 0} sessions</p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPatientForSchedule(patient);
                              setShowScheduleModal(true);
                            }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Schedule Session"
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPatientForPrescription(patient);
                              setShowPrescriptionModal(true);
                            }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Create Prescription"
                          >
                            <Pill className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/report/${patient.id}`)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="View Report"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              (patient.average_score || 0) >= 80 ? 'bg-green-500' :
                              (patient.average_score || 0) >= 60 ? 'bg-blue-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${patient.average_score || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold mb-4">Today's Schedule</h3>
                <div className="space-y-3">
                  {assignedSessions.filter(s => s.scheduled_date === new Date().toISOString().split('T')[0]).length === 0 ? (
                    <p className="text-gray-500 text-sm">No sessions scheduled for today</p>
                  ) : (
                    assignedSessions
                      .filter(s => s.scheduled_date === new Date().toISOString().split('T')[0])
                      .map(session => (
                        <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{session.patient_name || 'Patient'}</p>
                            <p className="text-xs text-gray-500">{getExerciseLabel(session.exercise_type)} at {session.scheduled_time}</p>
                          </div>
                          {session.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <button
                              onClick={() => completeSession(session.id)}
                              className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold mb-4">Recent Alerts</h3>
                <div className="space-y-3">
                  {patients.filter(p => (p.average_score || 0) < 60).slice(0, 3).map(patient => (
                    <div key={patient.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium">{patient.name}</p>
                        <p className="text-xs text-yellow-600">Below 60% compliance</p>
                      </div>
                    </div>
                  ))}
                  {patients.filter(p => (p.average_score || 0) < 60).length === 0 && (
                    <p className="text-gray-500 text-sm">All patients on track</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Scheduled Sessions</h2>
              <button
                onClick={() => {
                  setSelectedPatientForSchedule(patients[0] || null);
                  setShowScheduleModal(true);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center text-sm"
                disabled={patients.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {assignedSessions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No sessions scheduled</div>
              ) : (
                assignedSessions.map(session => (
                  <div key={session.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Play className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium">{session.patient_name || 'Patient'}</p>
                        <p className="text-sm text-gray-500">{getExerciseLabel(session.exercise_type)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">{formatDate(session.scheduled_date)}</p>
                        <p className="text-sm text-gray-500">{session.scheduled_time}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        session.status === 'completed' ? 'bg-green-100 text-green-700' :
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {session.status}
                      </span>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Prescriptions</h2>
              <button
                onClick={() => {
                  setSelectedPatientForPrescription(patients[0] || null);
                  setShowPrescriptionModal(true);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center text-sm"
                disabled={patients.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Prescription
              </button>
            </div>
            <div className="p-8 text-center text-gray-500">
              Select a patient and create a prescription
            </div>
          </div>
        )}
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Invite Patients</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={generateInvite}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center mb-4"
            >
              <Plus className="h-5 w-5 mr-2" />
              Generate New Code
            </button>
            {inviteCode && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold text-green-800 tracking-wider">{inviteCode}</span>
                  <button onClick={() => copyInviteCode(inviteCode)} className="p-2 bg-green-600 text-white rounded-lg">
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            <div>
              <h4 className="font-medium mb-2 text-sm">Active Codes</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {invites.filter(i => !i.used).map(invite => (
                  <div key={invite.invite_code} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                    <span className="font-mono">{invite.invite_code}</span>
                    <button onClick={() => copyInviteCode(invite.invite_code)} className="text-indigo-600">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add Patient</h3>
              <button onClick={() => setShowAddPatientModal(false)} className="text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patients..."
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button onClick={searchUnassignedPatients} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
                <Search className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {unassignedPatients.map(patient => (
                <div key={patient.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-gray-500">{patient.email}</p>
                  </div>
                  <button onClick={() => assignPatient(patient.id)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm">
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Session Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Schedule Session</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient</label>
                <select
                  value={selectedPatientForSchedule?.id || ''}
                  onChange={(e) => {
                    const p = patients.find(pat => pat.id === e.target.value);
                    setSelectedPatientForSchedule(p || null);
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Exercise</label>
                <select
                  value={scheduleExercise}
                  onChange={(e) => setScheduleExercise(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {exerciseTypes.map(e => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Optional notes..."
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">
                Schedule Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Create Prescription</h3>
              <button onClick={() => setShowPrescriptionModal(false)} className="text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient</label>
                <select
                  value={selectedPatientForPrescription?.id || ''}
                  onChange={(e) => {
                    const p = patients.find(pat => pat.id === e.target.value);
                    setSelectedPatientForPrescription(p || null);
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Exercise</label>
                <select
                  value={prescriptionExercise}
                  onChange={(e) => setPrescriptionExercise(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {exerciseTypes.map(e => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sets</label>
                  <input
                    type="number"
                    value={prescriptionSets}
                    onChange={(e) => setPrescriptionSets(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reps</label>
                  <input
                    type="number"
                    value={prescriptionReps}
                    onChange={(e) => setPrescriptionReps(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg"
                    min={1}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select
                    value={prescriptionFrequency}
                    onChange={(e) => setPrescriptionFrequency(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {frequencies.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration</label>
                  <input
                    type="text"
                    value={prescriptionDuration}
                    onChange={(e) => setPrescriptionDuration(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="e.g., 4 weeks"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Instructions..."
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">
                Create Prescription
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
