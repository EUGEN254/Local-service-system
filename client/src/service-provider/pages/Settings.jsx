import React, { useState, useEffect, useContext } from "react";
import { assets } from "../../assets/assets";
import { toast } from "sonner";
import * as settingsService from "../../services/settingsService";
import { ShareContext } from "../../sharedcontext/SharedContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Settings = () => {
  const { backendUrl, fetchCurrentUser, user } = useContext(ShareContext);
  const [previewImage, setPreviewImage] = useState(null);

  // Profile state
  const [profile, setProfile] = useState({
    image: null,
    name: "",
    email: "",
    phone: "",
    bio: "",
    address: "",
  });

  // Security state
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorAuth: false,
  });

  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [activeSection, setActiveSection] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Check if user has password (not Google signup)
  const hasPassword = user?.hasPassword !== null && user?.hasPassword !== undefined;

  // Initialize profile data from user context
  useEffect(() => {
    if (user) {
      setProfile({
        image: null,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        address: user.address || "",
      });

      // Set preview image if user has an image
      if (user.image) {
        setPreviewImage(user.image);
      }
    }
  }, [user]);

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field, value) => {
    setSecurity((prev) => ({ ...prev, [field]: value }));
  };

  // Update profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("email", profile.email);
      formData.append("phone", profile.phone);
      formData.append("bio", profile.bio);
      formData.append("address", profile.address);

      if (profile.image) {
        formData.append("image", profile.image);
      }

      const data = await settingsService.updateProfile(backendUrl, formData);
      await fetchCurrentUser();

      toast.success(data.message || "Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(
        err.response?.data?.message ||
          "Error updating service provider profile!",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update password function
  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Different validation for Google vs Email users
    if (hasPassword) {
      // For email users: require current password
      if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
        toast.error("Please fill in all password fields");
        return;
      }
    } else {
      // For Google users: only require new password
      if (!security.newPassword || !security.confirmPassword) {
        toast.error("Please fill in new password fields");
        return;
      }
    }

    if (security.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    if (security.newPassword !== security.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }

    setIsPasswordLoading(true);

    try {
      // Call appropriate endpoint based on user type
      let data;
      if (hasPassword) {
        // Regular password update
        data = await settingsService.updatePassword(
          backendUrl,
          security.currentPassword,
          security.newPassword,
        );
      } else {
        // Set initial password for Google users
        data = await settingsService.setInitialPassword(
          backendUrl,
          security.newPassword,
        );
      }

      if (data.success) {
        toast.success("Password changed successfully!");
        // Reset form
        setSecurity({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          twoFactorAuth: security.twoFactorAuth,
        });
        // Refresh user data
        await fetchCurrentUser();
      }
    } catch (err) {
      console.error("Error updating password:", err);
      const errorMessage =
        err.response?.data?.message || "Error updating password!";
      toast.error(errorMessage);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const menuItems = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "security", label: "Security", icon: "🔒" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6 h-fit">
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                    activeSection === item.id
                      ? "bg-gray-50 text-gray-700 border border-gray-200"
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
                    <h2 className="text-xl font-semibold text-gray-900">
                      Profile Information
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Update your personal and professional details
                    </p>
                  </div>

                  {/* Profile Image */}
                  <div className="relative">
                    <label
                      htmlFor="avatar"
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="file"
                        id="avatar"
                        accept=".png,.jpeg,.jpg"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleProfileChange("image", file);
                            setPreviewImage(URL.createObjectURL(file));
                          }
                        }}
                      />
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-400 flex items-center justify-center bg-gray-100">
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt="Profile Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={assets.avatar_icon}
                            alt="Default avatar"
                            className="w-12 h-12 opacity-60"
                          />
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) =>
                        handleProfileChange("name", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Email + Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                          handleProfileChange("email", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) =>
                          handleProfileChange("phone", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Professional Bio
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) =>
                        handleProfileChange("bio", e.target.value)
                      }
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors resize-vertical"
                      placeholder="Tell customers about your experience and expertise..."
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Address
                    </label>
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) =>
                        handleProfileChange("address", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
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
                      className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {hasPassword ? "Change Password" : "Set Password"}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {hasPassword 
                      ? "Update your password to keep your account secure"
                      : "Set a password to enable email login for your account"
                    }
                    {!hasPassword && (
                      <span className="block text-sm text-gray-500 mt-1">
                        You registered with Google. Set a password to also login with email.
                      </span>
                    )}
                  </p>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {/* Show current password only for email users */}
                    {hasPassword && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={security.currentPassword}
                            onChange={(e) =>
                              handleSecurityChange(
                                "currentPassword",
                                e.target.value,
                              )
                            }
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                            placeholder="Enter your current password"
                            required={hasPassword}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                          >
                            {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={security.newPassword}
                          onChange={(e) =>
                            handleSecurityChange("newPassword", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                          placeholder={
                            hasPassword 
                              ? "Enter your new password (min 6 characters)"
                              : "Set your password (min 6 characters)"
                          }
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Password must be at least 6 characters long
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={security.confirmPassword}
                          onChange={(e) =>
                            handleSecurityChange(
                              "confirmPassword",
                              e.target.value,
                            )
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                          placeholder="Confirm your new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6">
                      <button
                        type="submit"
                        disabled={isPasswordLoading}
                        className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPasswordLoading 
                          ? "Updating..." 
                          : hasPassword 
                            ? "Update Password" 
                            : "Set Password"
                        }
                      </button>
                    </div>
                  </form>
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