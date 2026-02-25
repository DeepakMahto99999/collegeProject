import express from 'express'
import cors from 'cors'
import 'dotenv/config';
import cookieParser from 'cookie-parser'

import connectDB from './config/mongodb.js';

import authRouter from './routes/auth.routes.js';
import sessionRoutes from './routes/session.routes.js'
import achievementRoutes from './routes/achievements.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import leaderboardRoutes from './routes/leaderboard.routes.js'
import statisticsRoutes from './routes/statistics.routes.js'
import { apiLimiter } from './middlewares/rateLimit.middleware.js';


const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.set("trust proxy" , 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors()); 

app.use("/api", apiLimiter);

app.get('/' , (req,res) => {
    res.send('FocusTube Backed Running')
});

app.use('/api/auth',authRouter);
app.use('/api/sessions', sessionRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/dashboard",dashboardRoutes)
app.use("/api/leaderboard",leaderboardRoutes)
app.use("/api/statistics",statisticsRoutes)

app.listen(PORT,() => {
    console.log(`Server running on port http://localhost:${PORT}`)
})
