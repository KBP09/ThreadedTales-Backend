import express from 'express'
import cors from 'cors';
import authRoute from './authRoute';
const app = express();

app.use(
    cors({
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    })
);

app.use(express.json());
app.use("/auth", authRoute);

export default app;