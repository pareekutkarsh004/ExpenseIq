import express from 'express';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import { connectDB } from './config/db.js';
import userRoutes from './routes/user.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import groupRoutes from './routes/group.routes.js';
configDotenv();
connectDB();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173', // Your Vite frontend URL
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});
// User routes 
app.use('/api/users', userRoutes);
// Expense routes 
app.use('/api/expenses', expenseRoutes);
// Group routes 
app.use('/api/groups', groupRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});