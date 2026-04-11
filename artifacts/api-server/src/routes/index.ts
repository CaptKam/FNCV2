import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import usersRouter from "./users";
import remoteConfigRouter from "./remoteConfig";
import curatedCollectionsRouter from "./curatedCollections";
import countriesRouter from "./countries";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(usersRouter);
router.use(remoteConfigRouter);
router.use(curatedCollectionsRouter);
router.use(countriesRouter);

export default router;
