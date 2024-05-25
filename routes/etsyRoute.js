const express = require("express");
const router = express.Router();
const {
  getListings, ping, oAuth, authenticate, getUsers,
  listPhysicalProduct,
} = require("../controllers/etsyController");


router.get('/', authenticate);
router.get("/ping", ping);
router.get("/oauth/redirect", oAuth);
router.get("/get-users", getUsers);
router.get("/list-physical-products", listPhysicalProduct);
router.get("/get-listings", getListings);

module.exports = router; 
