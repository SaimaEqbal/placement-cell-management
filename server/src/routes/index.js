import express from "express"
import authRouter from "./authRoutes.js"
import studentRouter from "./studentRoutes.js"
import spcRouter from "./spcRoutes.js";
import tpcRouter from "./tpcRoutes.js";
import companyRouter from "./companyRoutes.js";
import driveRouter from "./driveRoutes.js";
import applicationRouter from "./applicationRoutes.js";
import invitationRouter from "./invitationRoutes.js";
import companyPostRoutes from "./companyPostRoutes.js";
import notificationRouter from "./notificationRoutes.js";

const router = express.Router();

router.use('/auth', authRouter)
router.use('/students', studentRouter)
router.use('/spc',spcRouter);
router.use('/tpc',tpcRouter);
router.use('/companies',companyRouter);
router.use('/drive',driveRouter);
router.use('/application',applicationRouter);
router.use('/invite',invitationRouter);
router.use('/company-post',companyPostRoutes);
router.use('/notifications',notificationRouter);

export default router;