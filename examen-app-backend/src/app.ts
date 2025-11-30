import express, { Application } from 'express';
import cors from 'cors';
import routes from './routes';
import { loggerMiddleware, errorMiddleware, notFoundMiddleware } from './middlewares';

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
