// routes/serviceRoutes.js
import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import getServiceProviderName from "../middleware/getServiceProviderName.js";
import { addService,getMyServices,deleteService, editService } from "../controllers/serviceProviderControllers.js";
import userAuth from "../middleware/userAuth.js";

const serviceRouter = express.Router();

serviceRouter.post("/add-service",userAuth,getServiceProviderName,upload.single("image"),addService);
serviceRouter.get("/my-services", userAuth, getMyServices);
serviceRouter.delete("/delete/:id", userAuth, deleteService);
serviceRouter.put("/edit/:id", userAuth, upload.single("image"), editService);


export default serviceRouter;



