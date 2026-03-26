import { Camera, Cpu, MessageSquare, TrendingUp } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: Camera,
      title: 'Capture Movement',
      description: 'Our computer vision system uses your device camera to capture and analyze your body movements in real-time.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Cpu,
      title: 'AI Analysis',
      description: 'Advanced machine learning models process pose data to identify exercises and detect form deviations instantly.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: MessageSquare,
      title: 'Instant Feedback',
      description: 'Receive immediate visual and audio corrections to improve your form and maximize therapeutic benefits.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: TrendingUp,
      title: 'Track Progress',
      description: 'Monitor your rehabilitation journey with detailed analytics and share progress reports with your healthcare team.',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            How TherapyAI Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our intelligent system guides you through every step of your rehabilitation journey 
            with precision and personalized care.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 z-0"></div>
              )}
              
              <div className="relative z-10 text-center">
                <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <step.icon className="h-10 w-10 text-white" />
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Technical Specifications */}
        <div className="mt-20 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Technical Specifications
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">33+</div>
              <div className="text-gray-600">Body Landmarks Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">30fps</div>
              <div className="text-gray-600">Real-time Processing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-gray-600">Pose Detection Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{"< 50ms"}</div>
              <div className="text-gray-600">Feedback Latency</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;