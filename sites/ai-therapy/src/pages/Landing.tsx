import { useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Dashboard from '../components/Dashboard';
import DoctorPortal from '../components/DoctorPortal';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

const Landing = () => {
  const [activeTab, setActiveTab] = useState('patient');

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      
      {/* Dashboard Section */}
      <section id="dashboard" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Experience the Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our AI-powered assistant transforms physical therapy for both patients and healthcare providers
            </p>
          </div>
          
          <div className="flex justify-center mb-8">
            <div className="bg-white p-1 rounded-lg shadow-md">
              <button
                onClick={() => setActiveTab('patient')}
                className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                  activeTab === 'patient'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Patient View
              </button>
              <button
                onClick={() => setActiveTab('doctor')}
                className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                  activeTab === 'doctor'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Doctor Portal
              </button>
            </div>
          </div>
          
          {activeTab === 'patient' ? <Dashboard /> : <DoctorPortal />}
        </div>
      </section>
      
      <Contact />
      <Footer />
    </div>
  );
};

export default Landing;
