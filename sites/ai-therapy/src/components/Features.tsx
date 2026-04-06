import { Eye, Brain, BarChart3, Shield, Smartphone, Users } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Eye,
      title: 'Real-time Pose Tracking',
      description: 'Advanced MediaPipe integration tracks 33+ body landmarks with 95% accuracy for precise movement analysis.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Brain,
      title: 'AI Exercise Recognition',
      description: 'Machine learning models identify exercises and detect incorrect postures instantly with personalized corrections.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: BarChart3,
      title: 'Progress Analytics',
      description: 'Comprehensive tracking of sessions, performance metrics, and improvement trends with detailed insights.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Shield,
      title: 'HIPAA Compliant',
      description: 'Enterprise-grade security ensures patient data privacy and compliance with healthcare regulations.',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: Smartphone,
      title: 'Cross-platform Support',
      description: 'Works seamlessly on mobile devices, tablets, and computers with camera access for maximum accessibility.',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: Users,
      title: 'Doctor Integration',
      description: 'Secure portal for healthcare providers to monitor patient progress and adjust treatment plans remotely.',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Cutting-Edge Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered platform combines advanced computer vision, machine learning, 
            and healthcare expertise to deliver unprecedented rehabilitation support.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Technology Stack */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Powered by Leading Technologies
          </h3>
          
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-lg font-semibold text-gray-700">MediaPipe</div>
            <div className="text-lg font-semibold text-gray-700">TensorFlow</div>
            <div className="text-lg font-semibold text-gray-700">OpenCV</div>
            <div className="text-lg font-semibold text-gray-700">PyTorch</div>
            <div className="text-lg font-semibold text-gray-700">React Native</div>
            <div className="text-lg font-semibold text-gray-700">ARCore</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;