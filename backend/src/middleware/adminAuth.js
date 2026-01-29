// middleware/adminAuth.js
const adminAuth = (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
  
      // Check if user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required. Insufficient permissions."
        });
      }
  
      next();
    } catch (error) {
      console.error("Admin auth middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error in authentication"
      });
    }
  };
  
  export default adminAuth;
