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
      url: "https://i.pinimg.com/736x/b5/bd/36/b5bd3645659070d20d9aa549d7d301b2.jpg",
      title: "Plumbing"
    },
    {
      url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop",
      title: "Electrical"
    },
    {
      url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
      title: "Beauty Services"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* Left Column - Hero Section */}
      <div className="flex-1 flex flex-col justify-center items-start p-8 lg:p-12 xl:p-16 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 -left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
        
        <div className="relative z-10 max-w-lg -mt-8 lg:-mt-122">
          {/* Badge */}
          <div className="inline-flex items-center  max-md:mt-10 gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 animate-fade-in">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-white/80 font-medium">Trusted by 10,000+ users</span>
          </div>

          <h1 className="text-4xl md:text-3xl lg:text-4xl font-bold mb-6 leading-tight animate-slide-up">
            <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
              Book Local Services
            </span>
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
              Grow Your Business
            </span>
          </h1>

          <p className="text-lg text-gray-300 mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: "200ms" }}>
            The all-in-one platform connecting customers with trusted local service providers. 
            Whether you need a service or want to grow your business, we make it simple.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slide-up" style={{ animationDelay: "400ms" }}>
            <button
              onClick={() => {
                setAuthMode("Sign Up");
                setShowAuthModal(true);
              }}
              className="group relative bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative">Get Started Free</span>
            </button>
            
            <button className="group border border-white/30 hover:border-white/50 text-white font-medium py-4 px-8 rounded-xl text-lg transition-all duration-300 backdrop-blur-sm hover:bg-white/10">
              Learn More
            </button>
          </div>

          {/* Bottom CTA */}
          <div className="flex justify-start mb-5">
            <p className="text-gray-300  text-lg ">
              Have an account?{" "}
              <span
                onClick={() => {
                  setAuthMode("Login");
                  setShowAuthModal(true);
                }}
                className="text-blue-600 hover:text-blue-700 ml-2 cursor-pointer font-semibold transition-all duration-300 hover:underline underline-offset-4"
              >
                Sign in 
              </span>
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-400 animate-fade-in" style={{ animationDelay: "600ms" }}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-green-400 rounded-full"></div>
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
              Set up in 5 minutes
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Services & Features */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-md w-full">
          <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-gray-900 text-center animate-fade-in">
            Popular <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Services</span>
          </h2>
          
          {/* Service Images Grid */}
          <div className="grid grid-cols-2 gap-4 mb-12">
            {serviceImages.map((service, index) => (
              <div 
                key={index}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 cursor-pointer"
              >
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={service.url} 
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-all duration-500 rounded-2xl"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-semibold text-lg drop-shadow-2xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    {service.title}
                  </h3>
                  <div className="w-0 group-hover:w-8 h-0.5 bg-yellow-400 mt-2 transition-all duration-300"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Features List */}
          <div className="space-y-4 mb-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Why Choose Us</h3>
            {[
              { icon: "⚡", text: "Instant booking & real-time availability", delay: "100" },
              { icon: "📊", text: "Smart business management tools", delay: "200" },
              { icon: "💰", text: "Secure payments & financial tracking", delay: "300" },
              { icon: "🛟", text: "24/7 dedicated customer support", delay: "400" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/50 hover:bg-white/80 hover:border-white/80 transition-all duration-300 transform hover:translate-x-2 group cursor-pointer"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <span className="text-gray-700 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
          
          {/* Stats Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-lg">
            <div className="grid grid-cols-2 gap-6 text-center">
              <div className="animate-count-up" style={{ animationDelay: "100ms" }}>
                <AnimatedCounter target={500} suffix="+" duration={2000} className="text-2xl lg:text-3xl font-bold text-gray-900" />
                <div className="text-sm text-gray-600 mt-2 font-medium">Services Available</div>
              </div>
              <div className="animate-count-up" style={{ animationDelay: "300ms" }}>
                <AnimatedCounter target={10000} suffix="+" duration={2000} className="text-2xl lg:text-3xl font-bold text-gray-900" />
                <div className="text-sm text-gray-600 mt-2 font-medium">Happy Customers</div>
              </div>
              <div className="animate-count-up" style={{ animationDelay: "500ms" }}>
                <AnimatedCounter target={98} suffix="%" duration={2000} className="text-2xl lg:text-3xl font-bold text-gray-900" />
                <div className="text-sm text-gray-600 mt-2 font-medium">Satisfaction Rate</div>
              </div>
              <div className="animate-count-up" style={{ animationDelay: "700ms" }}>
                <div className="text-2xl lg:text-3xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-600 mt-2 font-medium">Support Available</div>
              </div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="m-4">
            <LoginSignUp initialState={authMode} setShowAuthModal={setShowAuthModal} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;