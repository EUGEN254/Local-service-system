
const getCustomerName = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
  
    if (req.user.role !== "customer") {
      return res.status(403).json({ success: false, message: "User is not a customer" });
    }
  
    req.customerName = req.user.name;
    next();
  };
  
  export default getCustomerName;
  