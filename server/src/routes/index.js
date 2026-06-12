import express from "express"
import authRouter from "./authRoutes.js"
import studentRouter from "./studentRoutes.js"
import spcRouter from "./spcRoutes.js";

const router = express.Router();

router.use('/auth', authRouter)
router.use('/students', studentRouter)
router.use('/spc',spcRouter);

export default router