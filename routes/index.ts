import express from 'express'
import cors from 'cors';

const app = express();

app.use(
    cors({
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    })
);

app.use(express.json());

export default app;