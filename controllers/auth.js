import { User } from "../models/index.js";
import { HttpError, sendEmail } from "../helpters/index.js";
import { userSchema, userEmailSchema } from "../schemas/userSchema.js";
import "dotenv/config";
import path from "path";
import fs from "fs/promises";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
import Jimp from "jimp";
import { nanoid } from "nanoid";

const { JWT_SECRET, BASE_URL } = process.env;

const avatarPath = path.resolve("public", "avatars");

const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { error } = userSchema.validate(req.body);

    if (!password || password.length < 6) {
      throw HttpError(400, "Password must contain at least 6 characters");
    }

    if (error) {
      throw HttpError(400);
    }

    const user = await User.findOne({ email });

    if (user) {
      throw HttpError(409);
    }

    const avatarURL = gravatar.url(email);
    const hashPassword = await bcryptjs.hash(password, 10);
    const verificationToken = nanoid();

    const newUser = await User.create({
      ...req.body,
      password: hashPassword,
      avatarURL,
      verificationToken,
    });

    const verifyEmail = {
      to: email,
      subject: "Verify email",
      html: `<p>Please confirm your email</p> 
      <a href="${BASE_URL}/api/users/verify/${verificationToken}" target="_blank">Confirm</a>`,
    };

    await sendEmail(verifyEmail);

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

const verify = async (req, res, next) => {
  const { verificationToken } = req.params;

  const user = await User.findOne({ verificationToken });

  if (!user) {
    throw HttpError(404);
  }

  await User.findByIdAndUpdate(user._id, {
    verificationToken: null,
    verify: true,
  });

  res.json({
    message: "Verification successful",
  });
};

const resendVerifyEmail = async (req, res, next) => {
  const { email } = req.body;
  const { error } = userEmailSchema.validate(req.body);

  const user = await User.findOne({ email });

  if (!user || error) {
    throw HttpError(400, "missing required field email");
  }

  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<p>Please confirm your email</p> 
      <a href="${BASE_URL}/api/users/verify/${user.verificationToken}" target="_blank">Confirm</a>`,
  };

  await sendEmail(verifyEmail);

  res.json({
    message: "Verification email sent",
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { error } = userSchema.validate(req.body);

    if (error) {
      throw HttpError(400);
    }

    const user = await User.findOne({ email });

    if (!user || !user.verify) {
      throw HttpError(401);
    }

    const passwordCompare = await bcryptjs.compare(password, user.password);

    if (!passwordCompare) {
      throw HttpError(401);
    }

    const payload = {
      id: user._id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });
    await User.findOneAndUpdate(user._id, { token });

    res.json({ token });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  const { _id } = req.user;

  const user = await User.findById(_id);

  if (!user) {
    throw HttpError(401, "Not authorized");
  }

  await User.findByIdAndUpdate(_id, { token: "" });

  res.status(204);
};

const getCurrent = async (req, res, next) => {
  const { _id } = req.user;

  const user = await User.findById(_id);

  if (!user) {
    throw HttpError(401, "Not authorized");
  }

  res.json({
    email: user.email,
    subscriprion: user.subscription,
  });
};

const updateStatusSubscription = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { subscription } = req.body;

    const user = await User.findByIdAndUpdate(_id, { subscription });

    if (!user) {
      throw HttpError(401, "Not authorized");
    }

    res.json({
      user: {
        email: user.email,
        subscription,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserAvatar = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { path: tmpPath, filename } = req.file;

    const user = await User.findById(_id);

    if (!user) {
      throw HttpError(401, "Not authorized");
    }

    const newPath = path.join(avatarPath, filename);

    const avatar = await Jimp.read(tmpPath);
    await avatar.resize(250, 250);
    await avatar.writeAsync(tmpPath);

    await fs.rename(tmpPath, newPath);

    const avatarURL = path.join("avatars", filename);

    await User.findByIdAndUpdate(_id, { avatarURL });

    res.json({
      avatarURL,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  signup,
  verify,
  resendVerifyEmail,
  login,
  logout,
  getCurrent,
  updateStatusSubscription,
  updateUserAvatar,
};
