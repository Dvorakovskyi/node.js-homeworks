import express from "express";
import { userController } from "../../controllers/index.js";
import { authenticate, upload } from "../../middlewares/index.js";

const authRouter = express.Router();

authRouter.post("/signup", userController.signup);

authRouter.post("/login", userController.login);

authRouter.post("/logout", authenticate, userController.logout);

authRouter.get("/current", authenticate, userController.getCurrent);

authRouter.patch("/", authenticate, userController.updateStatusSubscription);

authRouter.patch("/avatars", upload.single("avatar"), authenticate, userController.updateUserAvatar);

export default authRouter;
