import express from "express";
import axios from "axios";

const ordersRouter = express.Router();

const { API_KEY } = process.env;

const addNewOrder = (req, res, next) => {
  const { name, phone, color } = req.body;
  try {
    axios.defaults.headers.common["Authorization"] = `Bearer ${API_KEY}`;

    const response = axios.post("https://openapi.keycrm.app/v1/order", {
      source_id: 1,
      buyer: {
        full_name: name,
        phone,
      },
      buyer_comment: color,
    });

    res.status(201).json(response.data);
  } catch (error) {
    next(error);
  }
};

ordersRouter.post("/", addNewOrder);

export default ordersRouter;
