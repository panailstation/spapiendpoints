const express = require("express");
const router = express.Router();
const {
  getListings, ping, oAuth, authenticate, getUsers,
} = require("../controllers/etsyController");


router.get('/', authenticate);
router.get("/ping", ping);
router.post("/oAuth", oAuth);
router.get("/get-users", getUsers);
router.get("/get-listings", getListings);

module.exports = router; 
