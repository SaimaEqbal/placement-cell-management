import express from 'express';
import dotenv from "dotenv";
import pool from "./config/db.js";
import studentRoutes from "./routes/studentRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; 


app.use(express.json());
app.use("/students", studentRoutes);

app.listen(PORT , async () => {
  console.log(`🚀 Server listening on port ${process.env.PORT}`);

  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected:", result.rows[0]);
  } catch (err) {
    console.error("Database connection failed:", err);
  }
});


