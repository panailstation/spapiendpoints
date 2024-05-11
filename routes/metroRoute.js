const express = require("express");
const router = express.Router();
const {
    authenticate
} = require("../controllers/metroController");


router.get('/', authenticate);

module.exports = router; 
