import React, { useState } from 'react';

const Help = () => {
  const [activeTab, setActiveTab] = useState('faq');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqCategories = {
    general: [
      {
        question: "How do I update my service prices?",
        answer: "Go to 'My Services' section, click on the service you want to update, and edit the amount field. Don't forget to save your changes."
      },
      {
        question: "Why are my services not showing to customers?",
        answer: "Check if your service status is set to 'Active'. Inactive services are not visible to customers."
      }
    ],
    technical: [
      {
        question: "The app is crashing when I try to upload photos",
        answer: "Try refreshing before you upload again."
      },
      {
        question: "How do I reset my password?",
        answer: "Go to Settings > Account > Change Password. Instructions will be sent via email."
      }
    ],
  };

  const contactCategories = [
    { value: 'technical', label: 'Technical Issue' },
    { value: 'account', label: 'Account Problem' },
    { value: 'payment', label: 'Payment Issue' },
    { value: 'service', label: 'Service Related' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!subject || !message) return alert('Please fill in all fields');
    setIsSubmitting(true);
    setTimeout(() => {
      alert('Help ticket submitted successfully!');
      setSubject(''); setMessage(''); setSelectedCategory('general'); setIsSubmitting(false);
    }, 1000);
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief description of your issue"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        placeholder="Please describe your issue in detail..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-vertical"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-gray-800 mb-2">Service Provider Guide</h3>
                      <button className="text-yellow-600 text-sm font-semibold hover:text-yellow-700">Download PDF →</button>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-gray-800 mb-2">Best Practices</h3>
                      <button className="text-yellow-600 text-sm font-semibold hover:text-yellow-700">Read More →</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Quick Help Cards */}
      <div className="flex-shrink-0 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-9">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">📞</div>
            <h3 className="font-semibold text-gray-800 mb-1">Call Support</h3>
            <p className="text-gray-600 text-sm">+1 (555) 123-HELP</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">✉️</div>
            <h3 className="font-semibold text-gray-800 mb-1">Email Support</h3>
            <p className="text-gray-600 text-sm">support@localservice.com</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Help;
