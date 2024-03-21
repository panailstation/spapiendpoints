const express = require("express");
const router = express.Router();
const {
  catalogueItems,
  finances,
  getListingItems,
  orders,
  productFees,
  productPricing,
  reports,
  sales,
  getShipments,
  auth,
} = require("../controllers/amzController");

router.post("/auth", auth);
router.get("/catalogue-items", catalogueItems);
router.get("/listing-items", getListingItems);
router.get("/orders", orders);
router.get("/finances", finances);
router.get("/product-fees", productFees);
router.get("/product-pricing", productPricing);
router.get("/reports", reports);
router.get("/sales", sales);
router.get("/get-shipments", getShipments);

module.exports = router;
