import React, { useEffect, useRef, useContext } from "react";
import { motion } from "framer-motion";
import { ShareContext } from "../sharedcontext/SharedContext";
import { useNavigate } from "react-router-dom";

const LearnMore = ({ onClose, setShowAuthModal, setAuthMode }) => {
  const modalRef = useRef(null);
  const { user } = useContext(ShareContext);
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 z-40"></div>

      {/* Center Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Main Modal Container */}
        <div 
          ref={modalRef}
          className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-xl relative overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="bg-gray-900 text-white p-6">
            <h1 className="text-2xl md:text-3xl font-bold">
              How WorkLink Works
            </h1>
            <p className="text-gray-300 mt-2">
              Simple, transparent, and designed for real people
            </p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-8">
              {/* Simple Intro */}
              <div>
                <p className="text-gray-700 leading-relaxed">
                  WorkLink connects people who need services with skilled professionals in their area. 
                  Whether you're looking for home repairs, tech help, or business services, we make it 
                  easy to find the right person for the job.
                </p>
              </div>

              {/* How it Works - Simple Steps */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">How it works in 3 steps:</h2>
                
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Find what you need</h3>
                      <p className="text-gray-600">
                        Browse services by category or search for specific skills. See ratings, prices, 
                        and availability for each provider.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Book the service</h3>
                      <p className="text-gray-600">
                        Choose your preferred time, discuss details with the provider, and confirm your 
                        booking. No hidden fees.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Get the job done</h3>
                      <p className="text-gray-600">
                        The professional comes prepared, does the work, and gets paid securely through 
                        our platform. Leave a review to help others.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* For Customers vs Providers */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Made for everyone</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* For Customers */}
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-gray-900">For Customers</h3>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">Find trusted local professionals</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">See real reviews and prices upfront</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">Book and pay securely online</span>
                      </li>
                    </ul>
                  </div>

                  {/* For Providers */}
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-gray-900">For Service Providers</h3>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">Get more clients in your area</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">Manage bookings and payments easily</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">Build your reputation with reviews</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Real Feedback */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">What people are saying</h2>
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        MJ
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-700 italic mb-2">
                        "I needed a plumber fast when my kitchen sink backed up. Found someone on WorkLink 
                        who came the same day and fixed it for a fair price. Much better than guessing 
                        with random Google results."
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">Mike Johnson</span>
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Points */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Why it's better</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-gray-900 mb-2">✓ Verified</div>
                    <p className="text-gray-600 text-sm">All providers are checked and reviewed</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-gray-900 mb-2">✓ Secure</div>
                    <p className="text-gray-600 text-sm">Payments protected and held safely</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-gray-900 mb-2">✓ Simple</div>
                    <p className="text-gray-600 text-sm">No complicated forms or hidden costs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="bg-gray-50 border-t border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900">Ready to get started?</h3>
                <p className="text-gray-600 text-sm">It's free to join and takes 2 minutes</p>
              </div>
              <div className="flex gap-3">
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        navigate("/user/dashboard");
                        onClose();
                      }}
                      className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                    >
                      Go to Dashboard
                    </button>
                    <button
                      onClick={onClose}
                      className="bg-white border border-gray-300 hover:border-gray-400 text-gray-900 font-medium px-6 py-3 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setAuthMode("Sign Up");
                        setShowAuthModal(true);
                        onClose();
                      }}
                      className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                    >
                      Sign up free
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode("Login");
                        setShowAuthModal(true);
                        onClose();
                      }}
                      className="bg-white border border-gray-300 hover:border-gray-400 text-gray-900 font-medium px-6 py-3 rounded-lg transition-colors"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="text-gray-500 text-sm text-center mt-4">
              {user ? "Start exploring and booking services today" : "No credit card needed • Cancel anytime"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LearnMore;