import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import usersRouter from "./users";
import remoteConfigRouter from "./remoteConfig";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(usersRouter);
router.use(remoteConfigRouter);

export default router;
