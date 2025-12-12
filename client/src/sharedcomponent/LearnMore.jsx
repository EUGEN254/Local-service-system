import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Briefcase,
  Users,
  Clock,
  X,
} from "lucide-react";

const LearnMore = ({ onClose, setShowAuthModal, setAuthMode }) => {
  const modalRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"></div>

      {/* Center Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Main Modal Container */}
        <div className="w-full max-w-5xl h-[90vh] bg-linear-to-br from-slate-900 via-blue-900 to-purple-900 rounded-3xl shadow-2xl border border-white/10 text-white relative overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 text-white/70 hover:text-white transition bg-slate-900/80 backdrop-blur-sm rounded-full p-2 hover:bg-slate-900"
          >
            <X size={28} />
          </button>

          {/* Scrollable Content Area with Visible Scrollbar */}
          <div
            ref={modalRef}
            className="h-full overflow-y-auto p-10 md:p-16 pt-16"
          >
            <div className="space-y-10">
              {/* Header Section */}
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-5xl font-bold text-center"
              >
                Learn More About WorkLink Management System
              </motion.h1>

              {/* Intro Paragraph */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto text-center"
              >
                WorkLink is a smart platform designed to connect service
                providers with clients seamlessly. Our platform streamlines the
                entire process from discovery to payment, making it easier for
                both service providers and customers to connect and transact.
              </motion.p>

              {/* Features Section */}
              <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                {/* Feature 1 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition"
                >
                  <Briefcase className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">
                    Business Growth Tools
                  </h3>
                  <p className="text-gray-200">
                    Service providers can showcase skills, manage bookings,
                    track earnings, and grow their customer base with our
                    analytics tools.
                  </p>
                </motion.div>
                {/* Feature 2 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition"
                >
                  <Users className="w-12 h-12 mx-auto text-green-400 mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">
                    Verified Providers
                  </h3>
                  <p className="text-gray-200">
                    WorkLink ensures trusted and verified professionals for your
                    needs. All providers undergo background checks and skill
                    verification.
                  </p>
                </motion.div>
                {/* Feature 3 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition"
                >
                  <Clock className="w-12 h-12 mx-auto text-amber-400 mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">
                    Instant Booking
                  </h3>
                  <p className="text-gray-200">
                    Customers can quickly book services with instant
                    confirmations, real-time tracking, and secure payments.
                  </p>
                </motion.div>
              </div>

              {/* How It Works Section */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
                <h3 className="text-2xl font-semibold mb-6 text-center">
                  How It Works
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xl font-semibold text-yellow-400">
                      For Customers
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 shrink-0" />
                        <span>Browse verified service providers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 shrink-0" />
                        <span>Compare prices and reviews</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 shrink-0" />
                        <span>Book appointments instantly</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 shrink-0" />
                        <span>Leave reviews and ratings</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xl font-semibold text-yellow-400">
                      For Providers
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 shrink-0" />
                        <span>Create professional profiles</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 shrink-0" />
                        <span>Manage bookings and calendar</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 shrink-0" />
                        <span>Receive secure payments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 shrink-0" />
                        <span>Access analytics and insights</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 shrink-0" />
                        <span>Grow your business with marketing tools</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Benefits Section */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
                <h3 className="text-2xl font-semibold mb-6 text-center">
                  Key Benefits
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">
                      24/7
                    </div>
                    <p className="text-gray-200">Round-the-clock support</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      100%
                    </div>
                    <p className="text-gray-200">Secure transactions</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      5000+
                    </div>
                    <p className="text-gray-200">Active professionals</p>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 max-w-3xl mx-auto">
                <h3 className="text-2xl font-semibold mb-4 text-center">
                  What Our Users Say
                </h3>
                <div className="text-center italic text-gray-200">
                  "WorkLink transformed my freelance business. I went from
                  struggling to find clients to having a full schedule within
                  weeks. The platform is intuitive and the support team is
                  amazing!"
                </div>
                <div className="text-center mt-4 text-yellow-400">
                  - Sarah Johnson, Freelance Designer
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pb-8">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7 }}
                  onClick={() => {
                    setAuthMode("Sign Up");
                    setShowAuthModal(true);
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 bg-yellow-500 text-black px-8 py-4 rounded-full text-lg shadow-md hover:bg-yellow-600 transition font-semibold"
                >
                  Get Started <ArrowRight />
                </motion.button>
                <p className="text-gray-300 mt-4 text-lg">
                  Join thousands of satisfied users today
                </p>
                <p className="text-gray-400 mt-2 text-sm">
                  No credit card required • Free 30-day trial • Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LearnMore;
