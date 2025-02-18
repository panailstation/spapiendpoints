const express = require("express");
const router = express.Router();
const {
  // getListingItems,
  getOrders,
  getOrdersItems,
  // getShipment,
  auth,
  // getOrder,
  // createShipment,
  // cancelShipment,
  // purchaseLabel,
  // getFeeds,
  // createFeed,
  // putListing,
  // patchListing,
  // deleteListing,
  getInventory,
} = require("../controllers/amzController");
 
router.post("/auth", auth);
router.get("/get-orders", getOrders);
router.get("/get-orders/items", getOrdersItems);
// router.get("/get-order", getOrder); // a query "id" is required. e.g /get-order?id=302-3657553-1461165
// router.post("/createShipment", createShipment);
// router.get("/getShipment", getShipment); // a query "id" is required. e.g /getShipment?id=89108749065790
// router.post("/cancelShipment", cancelShipment); // a query "id" is required. e.g /cancelShipment?id=89108749065790
// router.post("/purchaseLabel", purchaseLabel); // a query "id" is required. e.g /purchaseLabel?id=89108749065790
// router.post("/createFeed", createFeed);
// router.get("/getFeeds", getFeeds);
// router.get("/listing-items", getListingItems);
// router.put("/putListing", putListing);
// router.patch("/patchListing", patchListing);
// router.delete("/deleteListing", deleteListing);
router.get("/get-inventory", getInventory);

module.exports = router;
