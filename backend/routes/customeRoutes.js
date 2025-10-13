import express from "express";
import { getServicesForCustomer } from "../controllers/customer.js";
import userAuth from "../middleware/userAuth.js";
import { createBooking, getUserBookings, updateFailedBooking, updatePaymentStatus,getServiceProviderDetails } from "../controllers/bookingController.js";


const customerRouter = express.Router();


customerRouter.get("/services", getServicesForCustomer);
customerRouter.post("/create", userAuth, createBooking);
customerRouter.get("/mybookings", userAuth, getUserBookings);
customerRouter.put("/update-booking-status/:id", updateFailedBooking)
customerRouter.put("/update-payment", userAuth, updatePaymentStatus);
customerRouter.get('/details/:serviceId', getServiceProviderDetails);


export default customerRouter;
