const express = require("express");
const router = express.Router();
const {
  catalogueItems,
  finances,
  getListingItems,
  messaging,
  notifications,
  orders,
  productFees,
  productPricing,
  reports,
  sales,
  getShipments,
  sellers,
  endpoints,
} = require("../controllers/amzController");

router.get("/", endpoints);
router.get("/catalogue-items", catalogueItems);
router.get("/finances", finances);
router.get("/listing-items", getListingItems);
router.get("/messaging", messaging);
router.get("/notifications", notifications);
router.get("/orders", orders);
router.get("/product-fees", productFees);
router.get("/product-pricing", productPricing);
router.get("/reports", reports);
router.get("/sales", sales);
router.get("/get-shipments", getShipments);
router.get("/sellers", sellers);

module.exports = router;
