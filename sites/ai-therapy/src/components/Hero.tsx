import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-white rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-white rounded-full blur-xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-white">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              🚀 Revolutionary AI Technology
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
              AI-Powered
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                Physiotherapy
              </span>
              Assistant
            </h1>
            
            <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed">
              Revolutionary real-time pose tracking and machine learning technology that provides 
              instant feedback and personalized rehabilitation guidance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button 
                onClick={() => navigate('/signup')}
                className="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 flex items-center justify-center group"
              >
                Start Your Recovery
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              
              <button 
                onClick={() => navigate('/login')}
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-all duration-300 flex items-center justify-center group"
              >
                <Play className="mr-2 h-5 w-5" />
                Sign In
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">95%</div>
                <div className="text-blue-200 text-sm">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-blue-200 text-sm">AI Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">50%</div>
                <div className="text-blue-200 text-sm">Faster Recovery</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="aspect-video bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl relative overflow-hidden">
                {/* Pose Tracking Visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Human figure representation */}
                    <div className="w-32 h-48 relative">
                      {/* Head */}
                      <div className="w-8 h-8 bg-green-400 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2 animate-pulse"></div>
                      
                      {/* Body */}
                      <div className="w-1 h-16 bg-green-400 absolute top-8 left-1/2 transform -translate-x-1/2"></div>
                      
                      {/* Arms */}
                      <div className="w-12 h-1 bg-green-400 absolute top-12 left-1/2 transform -translate-x-1/2 rotate-12"></div>
                      <div className="w-12 h-1 bg-green-400 absolute top-12 left-1/2 transform -translate-x-1/2 -rotate-12"></div>
                      
                      {/* Legs */}
                      <div className="w-14 h-1 bg-green-400 absolute bottom-8 left-1/2 transform -translate-x-1/2 rotate-12"></div>
                      <div className="w-14 h-1 bg-green-400 absolute bottom-8 left-1/2 transform -translate-x-1/2 -rotate-12"></div>
                      
                      {/* Joint points */}
                      <div className="w-2 h-2 bg-yellow-400 rounded-full absolute top-12 left-8 animate-pulse"></div>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full absolute top-12 right-8 animate-pulse"></div>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full absolute bottom-8 left-6 animate-pulse"></div>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full absolute bottom-8 right-6 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Real-time feedback overlay */}
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                  ✓ Perfect Form
                </div>
                
                <div className="absolute bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  AI Tracking Active
                </div>
              </div>
              
              <div className="mt-4 text-center text-white/80 text-sm">
                Real-time pose analysis with instant feedback
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;