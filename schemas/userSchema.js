import Joi from "joi";
import { emailRegexp } from "../constans/userConstans.js";

export const userSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(6).required(),
});

export const userEmailSchema = Joi.object({
  email: Joi.string().required(),
});
