const express = require("express");
const router = express.Router();
const {
  catalogueItems,
  finances,
  getListingItems,
  getOrders,
  productFees,
  productPricing,
  reports,
  sales,
  getShipment,
  auth,
  getOrder,
  createShipment,
  cancelShipment,
  purchaseLabel,
  getFeeds,
  createFeed,
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
router.get("/finances", finances);
router.get("/catalogue-items", catalogueItems);
router.get("/listing-items", getListingItems);
router.get("/product-fees", productFees);
router.get("/product-pricing", productPricing);
router.get("/reports", reports);
router.get("/sales", sales);

module.exports = router;
