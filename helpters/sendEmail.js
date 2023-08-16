import nodemailer from "nodemailer";
import "dotenv/config";

const { EMAIL, EMAIL_PASSWORD } = process.env;

const nodemailerConfig = {
  host: "smtp.ukr.net",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL,
    pass: EMAIL_PASSWORD,
  },
};

const transport = nodemailer.createTransport(nodemailerConfig);

const sendEmail = async (emailData) => {
  const email = { ...emailData, from: EMAIL };
  return transport.sendMail(email);
};

export default sendEmail;
