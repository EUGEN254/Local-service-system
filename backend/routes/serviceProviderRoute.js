// routes/serviceRoutes.js
import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import getServiceProviderName from "../middleware/getServiceProviderName.js";
import { addService,getMyServices,deleteService, editService, getServiceDetails,getProviderBookings, getCustomerDetails,updateStatus } from "../controllers/serviceProviderControllers.js";
import userAuth from "../middleware/userAuth.js";

const serviceRouter = express.Router();

serviceRouter.post("/add-service",userAuth,getServiceProviderName,upload.single("image"),addService);
serviceRouter.get("/my-services", userAuth, getMyServices);
serviceRouter.delete("/delete/:id", userAuth, deleteService);
serviceRouter.get("/mybookings", userAuth,getProviderBookings)
serviceRouter.get("/customer/:customerId", userAuth, getCustomerDetails);
serviceRouter.get("/details/:serviceId", getServiceDetails);
serviceRouter.put("/edit/:id", userAuth, upload.single("image"), editService);
serviceRouter.put('/booking/:id/status', updateStatus)

export default serviceRouter;



