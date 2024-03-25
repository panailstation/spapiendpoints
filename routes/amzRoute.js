const express = require("express");
const router = express.Router();
const {
  getListingItems,
  getOrders,
  getShipment,
  auth,
  getOrder,
  createShipment,
  cancelShipment,
  purchaseLabel,
  getFeeds,
  createFeed,
  putListing,
  patchListing,
  deleteListing,
} = require("../controllers/amzController");

router.post("/auth", auth);
router.get("/get-orders", getOrders);
router.get("/get-order", getOrder);
router.post("/createShipment", createShipment);
router.get("/getShipment", getShipment);
router.post("/cancelShipment", cancelShipment);
router.post("/purchaseLabel", purchaseLabel);
router.post("/createFeed", createFeed);
router.get("/getFeeds", getFeeds);
router.get("/listing-items", getListingItems);
router.put("/putListing", putListing);
router.patch("/patchListing", patchListing);
router.delete("/deleteListing", deleteListing);

module.exports = router;
