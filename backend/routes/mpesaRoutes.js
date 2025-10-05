import express from "express";
import { handleMpesa,handleCallback } from "../controllers/mpesaController.js";
import userAuth from "../middleware/userAuth.js";
import getCustomerName from "../middleware/getCustomerName.js";

const mpesaRouter = express.Router();

mpesaRouter.post("/stkpush", userAuth, getCustomerName, handleMpesa);
mpesaRouter.post("/callback", handleCallback);

export default mpesaRouter;
