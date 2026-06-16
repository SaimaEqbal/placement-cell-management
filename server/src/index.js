import express from 'express';
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import pool from "./config/db.js";
import Router from "./routes/index.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api', Router)

app.listen(PORT , async () => {
  console.log(`🚀 Server listening on port ${process.env.PORT}`);

  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected:", result.rows[0]);
  } catch (err) {
    console.error("Database connection failed:", err);
  }
});


