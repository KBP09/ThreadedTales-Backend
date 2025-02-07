import express from 'express'
import { signup, login, verifyOtp } from '../controllers/authController'

const authRoute = express.Router();

authRoute.post("/signup", signup);
authRoute.post("/login", login);
authRoute.post("/verifyOtp", verifyOtp);

export default authRoute;