import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Download, Calendar, Activity, TrendingUp,
  Clock, CheckCircle, AlertTriangle, BarChart3, Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, PatientReport } from '../services/api';

const ReportPage = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const [report, setReport] = useState<PatientReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'doctor') {
      navigate('/dashboard');
      return;
    }
    if (patientId) {
      generateReport();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, patientId]);

  const generateReport = async () => {
    if (!user?.id || !patientId) return;
    
    setError(null);
    
    try {
      const reportData = await api.getPatientReport(patientId, user.id);
      setReport(reportData);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!report) return;
    
    const content = generateReportHTML();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TherapyAI_Report_${report.patient_info.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportHTML = () => {
    if (!report) return '';
    
    const date = new Date(report.generated_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Patient Report - ${report.patient_info.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1f2937; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #4f46e5; }
    .logo { font-size: 28px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
    .subtitle { color: #6b7280; font-size: 14px; }
    .report-date { color: #9ca3af; font-size: 12px; margin-top: 5px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: 600; color: #4f46e5; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
    .patient-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; background: #f9fafb; padding: 20px; border-radius: 8px; }
    .info-item label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 2px; }
    .info-item span { font-weight: 500; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-card.green { background: linear-gradient(135deg, #059669, #10b981); }
    .stat-card.yellow { background: linear-gradient(135deg, #d97706, #f59e0b); }
    .stat-card.purple { background: linear-gradient(135deg, #7c3aed, #8b5cf6); }
    .stat-value { font-size: 32px; font-weight: bold; }
    .stat-label { font-size: 12px; opacity: 0.9; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .exercise-breakdown { margin-top: 20px; }
    .exercise-item { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
    .exercise-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .exercise-name { font-weight: 600; }
    .progress-bar { background: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .good { background: #10b981; }
    .moderate { background: #f59e0b; }
    .poor { background: #ef4444; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">TherapyAI</div>
    <div class="subtitle">Physical Therapy Progress Report</div>
    <div class="report-date">Generated on ${date}</div>
  </div>

  <div class="section">
    <div class="section-title">Patient Information</div>
    <div class="patient-info">
      <div class="info-item"><label>Name</label><span>${report.patient_info.name}</span></div>
      <div class="info-item"><label>Email</label><span>${report.patient_info.email}</span></div>
      <div class="info-item"><label>Report Period</label><span>${report.report_period.days} Days</span></div>
      <div class="info-item"><label>Active Days</label><span>${report.summary.active_days}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Performance Summary</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${report.summary.overall_average_score}%</div>
        <div class="stat-label">Avg. Score</div>
      </div>
      <div class="stat-card green">
        <div class="stat-value">${report.summary.overall_accuracy}%</div>
        <div class="stat-label">Accuracy Rate</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-value">${report.summary.total_frames}</div>
        <div class="stat-label">Total Frames</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-value">${report.summary.active_days}</div>
        <div class="stat-label">Active Days</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Exercise Breakdown</div>
    <div class="exercise-breakdown">
      ${report.summary.exercise_breakdown.map(ex => `
        <div class="exercise-item">
          <div class="exercise-header">
            <span class="exercise-name">${ex.exercise_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            <span>${ex.average_score}% avg | ${ex.accuracy_rate}% accuracy</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${ex.accuracy_rate >= 80 ? 'good' : ex.accuracy_rate >= 60 ? 'moderate' : 'poor'}" style="width: ${ex.accuracy_rate}%"></div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Recent Sessions</div>
    <table>
      <thead><tr><th>Exercise</th><th>Date</th><th>Duration</th><th>Score</th><th>Frames</th></tr></thead>
      <tbody>
        ${report.recent_sessions.map(s => `
          <tr>
            <td>${s.exercise_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
            <td>${new Date(s.started_at).toLocaleDateString()}</td>
            <td>${Math.round(s.duration_seconds / 60)} min</td>
            <td>${s.average_score}%</td>
            <td>${s.total_frames}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>This report was automatically generated by TherapyAI</p>
    <p>Report ID: ${report.patient_info.id.slice(0, 8)} | Generated: ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  const formatExerciseName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => navigate('/doctor')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/doctor')} className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <span className="text-xl font-bold text-gray-900">TherapyAI</span>
            </div>
          </div>
          <button
            onClick={downloadPDF}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {report.patient_info.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{report.patient_info.name}</h1>
                  <p className="text-gray-500">{report.patient_info.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Report Period</p>
                <p className="font-semibold">{report.report_period.days} Days</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(report.report_period.start_date).toLocaleDateString()} - {new Date(report.report_period.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white">
              <Target className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{report.summary.overall_average_score}%</p>
              <p className="text-sm opacity-80">Average Score</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
              <TrendingUp className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{report.summary.overall_accuracy}%</p>
              <p className="text-sm opacity-80">Accuracy Rate</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
              <BarChart3 className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{report.summary.total_frames}</p>
              <p className="text-sm opacity-80">Total Frames</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
              <Calendar className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{report.summary.active_days}</p>
              <p className="text-sm opacity-80">Active Days</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-indigo-600" />
              Exercise Performance
            </h2>
            <div className="space-y-4">
              {report.summary.exercise_breakdown.map((exercise) => (
                <div key={exercise.exercise_type} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">{formatExerciseName(exercise.exercise_type)}</span>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={getScoreColor(exercise.average_score)}>
                        {exercise.average_score}% avg
                      </span>
                      <span className="text-gray-500">{exercise.frame_count} frames</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(exercise.accuracy_rate)}`}
                      style={{ width: `${exercise.accuracy_rate}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>Accuracy: {exercise.accuracy_rate}%</span>
                    <span>
                      {exercise.accuracy_rate >= 80 ? 'Excellent' : exercise.accuracy_rate >= 60 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>
              ))}
              {report.summary.exercise_breakdown.length === 0 && (
                <p className="text-gray-500 text-center py-4">No exercise data available</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-indigo-600" />
              Recent Sessions
            </h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {report.recent_sessions.map((session, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{formatExerciseName(session.exercise_type)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(session.started_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(session.average_score)}`}>
                        {session.average_score}%
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(session.duration_seconds / 60)} min | {session.total_frames} frames
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {report.recent_sessions.length === 0 && (
                <p className="text-gray-500 text-center py-4">No sessions recorded</p>
              )}
            </div>
          </div>
        </div>

        {report.progress_data.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
              Daily Progress
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Exercise</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Sessions</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Avg Score</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {report.progress_data.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{formatExerciseName(item.exercise_type)}</td>
                      <td className="py-3 px-4">{item.session_count}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(item.average_score)}`}>
                          {item.average_score}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${getProgressColor(item.accuracy_rate)}`}
                              style={{ width: `${item.accuracy_rate}%` }}
                            />
                          </div>
                          <span className="text-sm">{item.accuracy_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Recommendations</h2>
          <div className="grid lg:grid-cols-2 gap-4">
            {report.summary.overall_accuracy < 60 && (
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Below Target Performance</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Consider scheduling additional sessions or adjusting the current exercise plan to improve form accuracy.
                  </p>
                </div>
              </div>
            )}
            {report.summary.active_days < 5 && (
              <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Increase Activity</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Patient has only been active on {report.summary.active_days} days. Encourage more consistent practice.
                  </p>
                </div>
              </div>
            )}
            {report.summary.exercise_breakdown.some(e => e.accuracy_rate < 60) && (
              <div className="flex items-start space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-800">Focus on Specific Exercises</p>
                  <p className="text-sm text-purple-700 mt-1">
                    The following exercises need attention:{' '}
                    {report.summary.exercise_breakdown
                      .filter(e => e.accuracy_rate < 60)
                      .map(e => formatExerciseName(e.exercise_type))
                      .join(', ')}
                  </p>
                </div>
              </div>
            )}
            {report.summary.overall_accuracy >= 80 && (
              <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Excellent Progress</p>
                  <p className="text-sm text-green-700 mt-1">
                    Patient is maintaining excellent form accuracy. Consider advancing to more challenging exercises.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportPage;
