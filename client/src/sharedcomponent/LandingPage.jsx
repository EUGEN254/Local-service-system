import React, { useState } from "react";
import LoginSignUp from "./LoginSignUp";
import AnimatedCounter from "./AnimatedCounter";

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("Sign Up");

  // Service images for the right column
  const serviceImages = [
    {
      url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
      title: "Home Cleaning"
    },
    {
      url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop",
      title: "Plumbing"
    },
    {
      url: "https://images.unsplash.com/photo-1621905251184-0e6b9f5e4c52?w=400&h=300&fit=crop",
      title: "Electrical"
    },
    {
      url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
      title: "Beauty Services"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Left Column */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-gradient-to-br from-gray-900 to-blue-900 text-white relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-ping"></div>
        
        <div className="relative z-10 text-center max-w-md">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent animate-fade-in">
            Local Services
          </h1>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed animate-slide-up">
            Connect with trusted local service providers or grow your business efficiently. 
            Your community's services, simplified.
          </p>
          <button
            onClick={() => {
              setAuthMode("Sign Up");
              setShowAuthModal(true);
            }}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg animate-pulse-slow"
          >
            Get Started Free
          </button>

          <p className="text-gray-400 mt-6 text-base">
            Already have an account?{" "}
            <span
              onClick={() => {
                setAuthMode("Login");
                setShowAuthModal(true);
              }}
              className="text-yellow-400 hover:text-yellow-300 cursor-pointer font-medium transition-all duration-300 hover:underline underline-offset-4"
            >
              Sign In
            </span>
          </p>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
        <div className="max-w-md w-full">
          <h2 className="text-4xl font-bold mb-8 text-gray-800 text-center animate-fade-in">
            Popular Services
          </h2>
          
          {/* Service Images Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {serviceImages.map((service, index) => (
              <div 
                key={index}
                className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
              >
                <img 
                  src={service.url} 
                  alt={service.title}
                  className="w-full h-24 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 rounded-xl"></div>
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-white text-sm font-semibold text-center drop-shadow-lg">
                    {service.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <ul className="space-y-4 mb-8">
            {[
              { icon: "⚡", text: "Book services instantly", delay: "100" },
              { icon: "📊", text: "Manage your business efficiently", delay: "200" },
              { icon: "💰", text: "Track payments easily", delay: "300" },
              { icon: "🛟", text: "24/7 customer support", delay: "400" },
            ].map((item, index) => (
              <li 
                key={index}
                className="flex items-center space-x-3 text-gray-700 text-base p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 transform hover:translate-x-2 animate-slide-right"
                style={{ animationDelay: `${item.delay}ms` }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.text}</span>
              </li>
            ))}
          </ul>
          
          {/* Stats Section */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-center bg-gray-50 rounded-2xl p-6">
            <div className="animate-count-up" style={{ animationDelay: "100ms" }}>
              <AnimatedCounter target={500} suffix="+" duration={2000} />
              <div className="text-sm text-gray-600 mt-1">Services</div>
            </div>
            <div className="animate-count-up" style={{ animationDelay: "300ms" }}>
              <AnimatedCounter target={10000} suffix="+" duration={2000} />
              <div className="text-sm text-gray-600 mt-1">Happy Users</div>
            </div>
            <div className="animate-count-up" style={{ animationDelay: "500ms" }}>
              <AnimatedCounter target={98} suffix="%" duration={2000} />
              <div className="text-sm text-gray-600 mt-1">Satisfaction</div>
            </div>
            <div className="animate-count-up" style={{ animationDelay: "700ms" }}>
              <div className="text-2xl font-bold text-gray-800">24/7</div>
              <div className="text-sm text-gray-600 mt-1">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div >
            <LoginSignUp initialState={authMode} setShowAuthModal={setShowAuthModal} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;