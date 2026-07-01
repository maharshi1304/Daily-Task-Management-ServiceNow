import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import incidentsRouter from "./incidents";
import serviceRequestsRouter from "./service_requests";
import workNotesRouter from "./work_notes";
import resolutionsRouter from "./resolutions";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(incidentsRouter);
router.use(serviceRequestsRouter);
router.use(workNotesRouter);
router.use(resolutionsRouter);
router.use(dashboardRouter);

export default router;
