import { Clock, Target, TrendingUp, Award, Play } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-1">Welcome back, Sarah!</h3>
            <p className="text-blue-100">Ready for today's session?</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">Day 24</div>
            <div className="text-blue-100 text-sm">Recovery Journey</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <Target className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-green-600">85%</span>
            </div>
            <p className="text-green-700 font-medium mt-2">Form Accuracy</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <Clock className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">45m</span>
            </div>
            <p className="text-blue-700 font-medium mt-2">Session Time</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">+12%</span>
            </div>
            <p className="text-purple-700 font-medium mt-2">Improvement</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between">
              <Award className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">7</span>
            </div>
            <p className="text-orange-700 font-medium mt-2">Achievements</p>
          </div>
        </div>

        {/* Today's Exercise Plan */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Today's Exercises</h4>
            <div className="space-y-3">
              {[
                { name: 'Shoulder Raises', sets: '3 sets × 15 reps', completed: true },
                { name: 'Arm Circles', sets: '2 sets × 20 reps', completed: true },
                { name: 'Wall Push-ups', sets: '3 sets × 10 reps', completed: false },
                { name: 'Range of Motion', sets: '5 minutes', completed: false }
              ].map((exercise, index) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-lg border ${
                  exercise.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div>
                    <h5 className="font-medium text-gray-900">{exercise.name}</h5>
                    <p className="text-sm text-gray-600">{exercise.sets}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {exercise.completed ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    ) : (
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center">
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Progress Chart</h4>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 h-64 flex items-center justify-center">
              {/* Simulated Chart */}
              <div className="w-full h-full relative">
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-200 to-blue-100 rounded opacity-60"></div>
                <div className="absolute bottom-0 left-1/4 w-1/12 bg-blue-600 rounded-t h-20"></div>
                <div className="absolute bottom-0 left-2/4 w-1/12 bg-blue-600 rounded-t h-28"></div>
                <div className="absolute bottom-0 left-3/4 w-1/12 bg-blue-600 rounded-t h-24"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Steady improvement over time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;