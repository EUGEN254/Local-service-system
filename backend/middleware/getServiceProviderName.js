// middlewares/getServiceProviderName.js
const getServiceProviderName = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
  
    if (req.user.role !== "service-provider") {
      return res.status(403).json({ success: false, message: "User is not a service provider" });
    }
  
    req.serviceProviderName = req.user.name; 
    next();
  };
  
  export default getServiceProviderName;
  