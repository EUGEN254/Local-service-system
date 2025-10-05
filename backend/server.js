import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import  connectDb from './configs/mongodb.js'
import connectCloudinary from './configs/cloudinary.js'
import userRouter from './routes/userRoutes.js'
import serviceRouter from './routes/serviceProviderRoute.js'
import customerRouter from './routes/customeRoutes.js'



const app = express();
const port = process.env.PORT || 4000;
connectDb();
connectCloudinary();

const allowedOrigins = ['http://localhost:5173']

app.use(express.json())
app.use(cookieParser())
app.use(cors({origin: allowedOrigins, credentials:true}))

// API endoints
app.get('/',(req,res)=> res.send('😁😁 API WORKING fine Programmer Eugen'));

app.listen(port, ()=> console.log(`Server started on PORT: ${port}`));

// routes now

app.use('/api/user', userRouter);
app.use('/api/serviceprovider', serviceRouter);
app.use('/api/customer', customerRouter);




