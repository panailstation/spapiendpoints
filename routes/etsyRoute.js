const express = require("express");
const router = express.Router();
const {
  getEtsyOrders,
} = require("../controllers/etsyController");

router.get("/get-orders", getEtsyOrders);

module.exports = router;
