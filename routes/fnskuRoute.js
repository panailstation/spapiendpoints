const express = require("express");
const router = express.Router();
const {
  convertFnskuToAsin,
} = require("../controllers/fnskutoasin/fnskutoasin");

router.post("/convert", convertFnskuToAsin);

module.exports = router;
