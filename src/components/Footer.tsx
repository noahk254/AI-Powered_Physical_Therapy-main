import { Activity, Twitter, Linkedin, Github, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">TherapyAI</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Revolutionizing physical therapy with AI-powered pose tracking and personalized rehabilitation guidance.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-300">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-300">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-300">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-300">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-3 text-gray-300">
              <li><a href="#features" className="hover:text-white transition-colors duration-300">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-300">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-300">API Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-300">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-300">Security</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-3 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors duration-300">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-300">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-300">Case Studies</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-300">Webinars</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-300">Blog</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors duration-300">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-300">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-300">Press Kit</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors duration-300">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-300">Partners</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300">
              © {currentYear} TherapyAI. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">Privacy Policy</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">Terms of Service</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">HIPAA Compliance</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;