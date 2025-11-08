import React, { useState } from 'react';
import { useContext } from 'react';
import { ShareContext } from '../../sharedcontext/SharedContext';
import axios from 'axios'
import { toast } from "react-toastify";

const Help = () => {
  const [activeTab, setActiveTab] = useState('faq');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {backendUrl} = useContext(ShareContext)

  const faqCategories = {
    general: [
      {
        question: "How do I update my service prices?",
        answer: "Go to 'My Services' section, click on the service you want to update, and edit the amount field. Don't forget to save your changes."
      },
      {
        question: "Why are my services not showing to customers?",
        answer: "Check if your service status is set to 'Active'. Inactive services are not visible to customers. Also ensure your profile is complete and verified."
      },
      {
        question: "How do I manage my bookings?",
        answer: "Navigate to the 'Bookings' section to view all incoming requests. You can accept, decline, or update the status of each booking."
      }
    ],
    technical: [
      {
        question: "The app is crashing when I try to upload photos",
        answer: "Try clearing your browser cache or using a different browser. Ensure images are under 5MB and in JPG/PNG format."
      },
      {
        question: "How do I reset my password?",
        answer: "Go to Settings > Account > Change Password. You'll receive an email with instructions to reset your password."
      },
      {
        question: "Notifications are not working",
        answer: "Check your browser notification settings and ensure you've allowed notifications for our site. Also verify your internet connection."
      }
    ],
    payments: [
      {
        question: "When will I receive my payments?",
        answer: "Payments are processed within 3-5 business days after service completion. You can track payments in the 'Earnings' section."
      },
      {
        question: "What payment methods are supported?",
        answer: "We support M-Pesa for online payments and cash payments. All transactions are secure and encrypted."
      },
      {
        question: "How are service fees calculated?",
        answer: "We charge a 10% service fee on completed bookings. This helps us maintain the platform and provide customer support."
      }
    ]
  };

  const contactCategories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'account', label: 'Account Problem' },
    { value: 'payment', label: 'Payment Issue' },
    { value: 'service', label: 'Service Related' },
    { value: 'other', label: 'Other' }
  ];

  // Resource data with actual content
  const resources = [
    {
      id: 1,
      title: "Service Provider Guide",
      description: "Complete guide to getting started as a service provider",
      type: "pdf",
      content: `
# Service Provider Guide

## Getting Started
1. Complete your profile with accurate information
2. Add high-quality photos of your previous work
3. Set competitive but fair pricing
4. Write clear service descriptions

## Best Practices
- Respond to booking requests within 2 hours
- Maintain clear communication with customers
- Always arrive on time for appointments
- Follow up after service completion

## Building Your Reputation
- Ask satisfied customers for reviews
- Share your portfolio regularly
- Maintain high service standards
- Handle issues professionally
      `,
      downloadUrl: "#"
    },
    {
      id: 2,
      title: "Best Practices Handbook",
      description: "Tips for delivering excellent service and growing your business",
      type: "guide",
      content: `
# Best Practices Handbook

## Customer Communication
- Always confirm appointments 24 hours in advance
- Be clear about pricing and any additional costs
- Respond to messages promptly
- Set realistic expectations

## Service Delivery
- Arrive 10-15 minutes early
- Bring all necessary tools and equipment
- Keep the work area clean and organized
- Explain what you're doing to the customer

## Building Trust
- Show your identification upon arrival
- Provide before-and-after photos when possible
- Follow up to ensure customer satisfaction
- Handle complaints professionally
      `
    },
    {
      id: 3,
      title: "Pricing Strategy Template",
      description: "Worksheet to help you set competitive and profitable prices",
      type: "template",
      content: `
# Pricing Strategy Template

## Cost Calculation
- Material costs: _________
- Labor time: _________
- Transportation: _________
- Tools & Equipment: _________
- **Total Cost: _________**

## Profit Margin
- Desired profit margin: _________
- Recommended price: _________
- Market competitive price: _________
- Final price: _________

## Pricing Tips
- Research competitor prices regularly
- Consider offering package deals
- Adjust prices based on complexity
- Offer seasonal promotions
      `
    },
    {
      id: 4,
      title: "Customer Service Scripts",
      description: "Professional communication templates for different scenarios",
      type: "scripts",
      content: `
# Customer Service Scripts

## Initial Response
"Hello [Customer Name], thank you for your booking request for [Service]. I'm available on [Date] at [Time]. Would this work for you?"

## Pricing Discussion
"The total cost for [Service] will be KES [Amount]. This includes [List inclusions]. Are there any additional requirements I should know about?"

## Follow-up Message
"Hi [Customer Name], I wanted to follow up on the [Service] I completed. Everything is working well? Please don't hesitate to reach out if you need anything else!"

## Handling Issues
"I understand your concern about [Issue]. I'd like to make this right by [Solution]. When would be a good time for me to come address this?"
      `
    }
  ];

  const [selectedResource, setSelectedResource] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!subject || !message) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/support/submit`,
        {
          category: selectedCategory,
          subject,
          message
        },
        { withCredentials: true }
      );
  
      if (data.success) {
        toast.success('Help ticket submitted successfully! Our team will contact you within 2 hours.');
        setSubject('');
        setMessage('');
        setSelectedCategory('general');
      }
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewResource = (resource) => {
    setSelectedResource(resource);
    setShowResourceModal(true);
  };

  const handleDownloadResource = (resource) => {
    // Create a downloadable file
    const element = document.createElement('a');
    const file = new Blob([resource.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${resource.title.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    alert(`Downloading ${resource.title}`);
  };

  const handleCallSupport = () => {
    if (window.confirm('Call support at +254 700 123 456?')) {
      window.location.href = 'tel:+254700123456';
    }
  };

  const handleEmailSupport = () => {
    const subject = encodeURIComponent('Support Request');
    const body = encodeURIComponent('Hello Support Team,\n\nI need assistance with:');
    window.location.href = `mailto:support@localservicesystem.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex flex-col h-screen p-4 sm:p-6 bg-gray-50">
      
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Help & Support</h1>
        <p className="text-gray-600 mt-2">Get help with your account, services, and technical issues</p>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">24/7</div>
            <div className="text-sm text-gray-600">Support Available</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">2h</div>
            <div className="text-sm text-gray-600">Average Response Time</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-purple-600">98%</div>
            <div className="text-sm text-gray-600">Issues Resolved</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex overflow-x-auto -mb-px">
                {['faq', 'contact', 'resources'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 sm:flex-none whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === tab ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab === 'faq' ? 'FAQ' : tab === 'contact' ? 'Contact Admin' : 'Resources'}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">

              {/* FAQ Tab */}
              {activeTab === 'faq' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.keys(faqCategories).map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                          selectedCategory === category
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {faqCategories[selectedCategory].map((faq, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-yellow-300 transition-colors">
                        <h3 className="font-semibold text-gray-800 mb-2">Q: {faq.question}</h3>
                        <p className="text-gray-600 text-sm">A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === 'contact' && (
                <div className="max-w-2xl">
                  <h2 className="text-xl font-semibold mb-4">Contact Admin Support</h2>
                  <p className="text-gray-600 mb-4">Our support team typically responds within 2 hours during business hours (8 AM - 6 PM EAT).</p>
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      >
                        {contactCategories.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief description of your issue"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        placeholder="Please describe your issue in detail..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-vertical"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                  </form>
                </div>
              )}

              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Helpful Resources</h2>
                  <p className="text-gray-600">Download these resources to help grow your business and improve your service delivery.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resources.map((resource) => (
                      <div key={resource.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-800">{resource.title}</h3>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full capitalize">
                            {resource.type}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewResource(resource)}
                            className="text-yellow-600 text-sm font-semibold hover:text-yellow-700 border border-yellow-600 px-3 py-1 rounded-lg transition-colors"
                          >
                            View Content
                          </button>
                          <button
                            onClick={() => handleDownloadResource(resource)}
                            className="bg-yellow-500 text-white text-sm font-semibold hover:bg-yellow-600 px-3 py-1 rounded-lg transition-colors"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Quick Help Cards */}
      <div className="flex-shrink-0 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div 
              onClick={handleCallSupport}
              className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600 text-xl"
            >
              📞
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Call Support</h3>
            <p className="text-gray-600 text-sm">+254 700 123 456</p>
            <p className="text-xs text-gray-500 mt-1">Tap to call</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div 
              onClick={handleEmailSupport}
              className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600 text-xl"
            >
              ✉️
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Email Support</h3>
            <p className="text-gray-600 text-sm">support@localservicesystem.com</p>
            <p className="text-xs text-gray-500 mt-1">Tap to email</p>
          </div>
        </div>
      </div>

      {/* Resource Modal */}
      {showResourceModal && selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">{selectedResource.title}</h3>
              <button
                onClick={() => setShowResourceModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <pre className="whitespace-pre-wrap text-gray-700 text-sm font-sans">
                {selectedResource.content}
              </pre>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowResourceModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadResource(selectedResource)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Help;