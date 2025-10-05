import express from "express";
import { getServicesForCustomer } from "../controllers/customer.js";


const customerRouter = express.Router();


customerRouter.get("/services", getServicesForCustomer);

export default customerRouter;
