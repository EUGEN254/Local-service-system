import React, { useState } from "react";

const Settings = () => {
  // Profile State
  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    bio: "Professional service provider with 5+ years of experience in home services.",
    address: "123 Main Street, City, State 12345"
  });

  // Notification State
  const [notifications, setNotifications] = useState({
    newRequest: true,
    requestUpdated: true,
    earningsUpdated: true,
    newMessage: true,
    reviewReceived: false,
    promotionOffers: false,
  });

  // Security State
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorAuth: false
  });

  const [emailPush, setEmailPush] = useState(true);
  const [appearance, setAppearance] = useState("light");
  const [activeSection, setActiveSection] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (name) => {
    setNotifications({ ...notifications, [name]: !notifications[name] });
  };

  const handleSecurityChange = (field, value) => {
    setSecurity(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      alert('Profile updated successfully!');
      setIsLoading(false);
    }, 1000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (security.newPassword !== security.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      alert('Password changed successfully!');
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "", twoFactorAuth: security.twoFactorAuth });
      setIsLoading(false);
    }, 1000);
  };

  const menuItems = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "appearance", label: "Appearance", icon: "🎨" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6 h-fit">
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                    activeSection === item.id
                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Section */}
            {activeSection === "profile" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <p className="text-gray-600 mt-1">Update your personal and professional details</p>
                  </div>
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      JD
                    </div>
                    <button className="absolute -bottom-1 -right-1 bg-white border border-gray-300 rounded-full p-1 shadow-sm hover:shadow-md transition-shadow">
                      <span className="text-sm">📷</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => handleProfileChange("firstName", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => handleProfileChange("lastName", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleProfileChange("email", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleProfileChange("phone", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Professional Bio
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => handleProfileChange("bio", e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors resize-vertical"
                      placeholder="Tell customers about your experience and expertise..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Max 500 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Address
                    </label>
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) => handleProfileChange("address", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
                      placeholder="Your primary service location"
                    />
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Notification Preferences</h2>
                  <p className="text-gray-600 mb-6">Choose what notifications you want to receive</p>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Service Notifications</h3>
                      <div className="space-y-4">
                        {Object.entries(notifications).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                            <div>
                              <p className="font-medium text-gray-800 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Get notified when {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={() => handleCheckboxChange(key)}
                                className="sr-only"
                              />
                              <div className={`w-12 h-6 bg-gray-300 rounded-full peer-focus:ring-2 peer-focus:ring-yellow-500 peer-checked:bg-yellow-500 transition`}></div>
                              <div
                                className={`dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transition transform ${
                                  value ? "translate-x-6" : "translate-x-0"
                                }`}
                              ></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-800">Email Notifications</h3>
                          <p className="text-sm text-gray-600 mt-1">Receive notifications via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={emailPush}
                            onChange={() => setEmailPush(!emailPush)}
                            className="sr-only"
                          />
                          <div className={`w-12 h-6 bg-gray-300 rounded-full peer-focus:ring-2 peer-focus:ring-yellow-500 peer-checked:bg-yellow-500 transition`}></div>
                          <div
                            className={`dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transition transform ${
                              emailPush ? "translate-x-6" : "translate-x-0"
                            }`}
                          ></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Change Password</h2>
                  <p className="text-gray-600 mb-6">Update your password to keep your account secure</p>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={security.currentPassword}
                        onChange={(e) => handleSecurityChange("currentPassword", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={security.newPassword}
                        onChange={(e) => handleSecurityChange("newPassword", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={security.confirmPassword}
                        onChange={(e) => handleSecurityChange("confirmPassword", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center space-x-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={security.twoFactorAuth}
                            onChange={() => handleSecurityChange("twoFactorAuth", !security.twoFactorAuth)}
                            className="sr-only"
                          />
                          <div className={`w-12 h-6 bg-gray-300 rounded-full peer-focus:ring-2 peer-focus:ring-yellow-500 peer-checked:bg-yellow-500 transition`}></div>
                          <div
                            className={`dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transition transform ${
                              security.twoFactorAuth ? "translate-x-6" : "translate-x-0"
                            }`}
                          ></div>
                        </label>
                        <div>
                          <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-600">Add an extra layer of security</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-6">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === "appearance" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Appearance Settings</h2>
                <p className="text-gray-600 mb-6">Customize how the app looks and feels</p>

                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">Theme</p>
                      <p className="text-sm text-gray-600 mt-1">Choose your preferred theme</p>
                    </div>
                    <select
                      value={appearance}
                      onChange={(e) => setAppearance(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent min-w-[120px]"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">Language</p>
                      <p className="text-sm text-gray-600 mt-1">Choose your preferred language</p>
                    </div>
                    <select
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent min-w-[120px]"
                      defaultValue="english"
                    >
                      <option value="english">English</option>
                      <option value="spanish">Spanish</option>
                      <option value="french">French</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-gray-800">Font Size</p>
                      <p className="text-sm text-gray-600 mt-1">Adjust the text size</p>
                    </div>
                    <select
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent min-w-[120px]"
                      defaultValue="medium"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;