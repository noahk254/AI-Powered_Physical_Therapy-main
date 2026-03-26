import { Users, Activity, FileText, AlertTriangle, Calendar, Filter } from 'lucide-react';

const DoctorPortal = () => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-1">Dr. Martinez Dashboard</h3>
            <p className="text-indigo-100">Monitoring 24 active patients</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors duration-300 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors duration-300 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">24</span>
            </div>
            <p className="text-blue-700 font-medium mt-2">Active Patients</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <Activity className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-green-600">89%</span>
            </div>
            <p className="text-green-700 font-medium mt-2">Compliance Rate</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">3</span>
            </div>
            <p className="text-yellow-700 font-medium mt-2">Need Attention</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <FileText className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">12</span>
            </div>
            <p className="text-purple-700 font-medium mt-2">Reports Due</p>
          </div>
        </div>

        {/* Patient List */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Recent Patient Activity</h4>
            <div className="space-y-3">
              {[
                { name: 'Sarah Johnson', condition: 'Shoulder Recovery', status: 'excellent', progress: 85 },
                { name: 'Michael Chen', condition: 'Knee Rehabilitation', status: 'good', progress: 72 },
                { name: 'Emma Davis', condition: 'Back Therapy', status: 'attention', progress: 45 },
                { name: 'James Wilson', condition: 'Hip Recovery', status: 'good', progress: 68 }
              ].map((patient, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-300">
                  <div>
                    <h5 className="font-medium text-gray-900">{patient.name}</h5>
                    <p className="text-sm text-gray-600">{patient.condition}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{patient.progress}%</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        patient.status === 'excellent' ? 'bg-green-100 text-green-700' :
                        patient.status === 'good' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {patient.status}
                      </div>
                    </div>
                    <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Analytics Overview</h4>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h5 className="font-medium text-gray-900 mb-2">Average Recovery Time</h5>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">-23%</span>
                  <span className="text-sm text-gray-600">vs. traditional therapy</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h5 className="font-medium text-gray-900 mb-2">Patient Satisfaction</h5>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">94%</span>
                  <span className="text-sm text-gray-600">positive feedback</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h5 className="font-medium text-gray-900 mb-2">Exercise Compliance</h5>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: '89%' }}></div>
                </div>
                <span className="text-sm text-gray-600">89% average completion rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPortal;