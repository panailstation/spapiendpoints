const axios = require("axios");
const fs = require("fs");
const moment = require("moment");
const { authenticate } = require("../utils/amz/auth");
const { createFeedDocument, uploadFeed } = require("../utils/amz/feeds");
const { shipmentData } = require("../utils/amz/shipmentData");
const { listingData, patchListingData } = require("../utils/amz/listingData");
const { google } = require("googleapis");

const marketplace_id = "A1PA6795UKMFR9"; // This is used for the case of a single id
const marketplaceIds = [
  "A13V1IB3VIYZZH",
  "APJ6JRA9NG5V4",
  "A1RKKUPIHCS9HS",
  "AMEN7PMS3EDWL",
  "A1PA6795UKMFR9",
  "A1805IZSGTT6HS",
  "A1F83G8C2ARO7P",
  "A1C3SOZRARQ6R3",
  "A2NODRKZP88ZB9",
]; // This is used for the case of many ids. You can add as much as possible.
const endpoint = "https://sellingpartnerapi-eu.amazon.com";
const sku = "T5-TUY3-3FH8";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


const auth = async (req, res) => {
  try {
    const response = await axios.post("https://api.amazon.com/auth/o2/token", {
      grant_type: "refresh_token",
      refresh_token: process.env.REFRESH_TOKEN,
      client_id: process.env.SELLING_PARTNER_APP_CLIENT_ID,
      client_secret: process.env.SELLING_PARTNER_APP_CLIENT_SECRET,
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching access token:", error.message);
    res.status(500).json({ error: "Failed to authenticate", error: error });
  }
};

// const getOrders = async (req, res) => {
//   const { marketplaceids } = req.query;

//   try {
//     const createdAfter = "2023-01-01T00:00:00Z";
//     let authTokens = await authenticate();
//     const baseUrl = `${endpoint}/orders/v0/orders`;

//     const queryParams = {
//       MarketplaceIds: marketplaceids, 
//       CreatedAfter: createdAfter,
//       MaxResultsPerPage: 100, // Reduce number of requests
//     };

//     let allOrders = [];
//     let nextToken = null;
//     const maxRetries = 7;
//     let retryCount = 0;

//     do {
//       if (nextToken) {
//         queryParams.NextToken = nextToken;
//         // await sleep(15000); // Increased delay to 15 seconds
//       } else {
//         delete queryParams.NextToken;
//       }

//       const queryString = new URLSearchParams(queryParams).toString();
//       const url = `${baseUrl}?${queryString}`;

//       try {
//         const response = await axios.get(url, {
//           headers: {
//             "x-amz-access-token": authTokens.access_token,
//             "Content-Type": "application/json",
//           },
//         });

//         const ordersData = response.data.payload.Orders || [];
//         allOrders = allOrders.concat(ordersData);

//         // Ensure nextToken exists and is valid before continuing
//         nextToken = response.data.payload.NextToken?.trim() || null;
//         // nextToken = null;

//         retryCount = 0; // Reset retry count on successful request
//       } catch (error) {
//         if (error.response && error.response.status === 429) {
//           retryCount++;
//           if (retryCount > maxRetries) {
//             throw new Error("Max retries exceeded");
//           }
//           const retryAfter =
//             error.response.headers["retry-after"] || Math.pow(2, retryCount);
//           console.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);
//           await new Promise((resolve) =>
//             setTimeout(resolve, retryAfter * 1000)
//           );
//         } else {
//           throw error;
//         }
//       }
//     } while (nextToken && nextToken !== "null");

//     const values = allOrders.map((order) => ({
//       BuyerInfo: order.BuyerInfo,
//       AmazonOrderId: order.AmazonOrderId,
//       EarliestShipDate: order.EarliestShipDate,
//       SalesChannel: order.SalesChannel,
//       OrderStatus: order.OrderStatus,
//       NumberOfItemsShipped: order.NumberOfItemsShipped,
//       OrderType: order.OrderType,
//       IsPremiumOrder: order.IsPremiumOrder,
//       IsPrime: order.IsPrime,
//       FulfillmentChannel: order.FulfillmentChannel,
//       NumberOfItemsUnshipped: order.NumberOfItemsUnshipped,
//       HasRegulatedItems: order.HasRegulatedItems,
//       IsReplacementOrder: order.IsReplacementOrder,
//       IsSoldByAB: order.IsSoldByAB,
//       LatestShipDate: order.LatestShipDate,
//       ShipServiceLevel: order.ShipServiceLevel,
//       IsISPU: order.IsISPU,
//       MarketplaceId: order.MarketplaceId,
//       PurchaseDate: order.PurchaseDate,
//       ShippingAddress: order.ShippingAddress,
//       IsAccessPointOrder: order.IsAccessPointOrder,
//       SellerOrderId: order.SellerOrderId,
//       PaymentMethod: order.PaymentMethod,
//       IsBusinessOrder: order.IsBusinessOrder,
//       OrderTotal: order.OrderTotal,
//       PaymentMethodDetails: order.PaymentMethodDetails,
//       IsGlobalExpressEnabled: order.IsGlobalExpressEnabled,
//       LastUpdateDate: order.LastUpdateDate,
//       ShipmentServiceLevelCategory: order.ShipmentServiceLevelCategory,
//     }));

//     res.status(200).json(values);
//   } catch (error) {
//     console.error(`Error getting orders: ${error.message}`);
//     res
//       .status(500)
//       .json({ message: "Error getting orders", error: error.message });
//   }
// };

const getOrders = async (req, res) => {
  const { marketplaceids } = req.query;
  
  try {
    const createdAfter = "2025-01-01T00:00:00Z";
    let authTokens = await authenticate();
    const baseUrl = `${endpoint}/orders/v0/orders`;

    const queryParams = {
      MarketplaceIds: marketplaceids, 
      CreatedAfter: createdAfter,
      MaxResultsPerPage: 100,
    };

    let allOrders = [];
    let nextToken = null;
    const maxRetries = 7;
    let availableTokens = 20; // Burst capacity
    const refillRate = 0.0167; // Requests per second (1 per 60s)
    
    // Function to introduce a delay with jitter
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const getExponentialBackoffTime = (retryCount) => {
      const baseDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      const jitter = Math.random() * 1000; // Add jitter
      return baseDelay + jitter;
    };
    
    const refillTokens = async () => {
      while (true) {
        await sleep(60000); // Wait 60 seconds before refilling
        if (availableTokens < 20) {
          availableTokens++;
        }
      }
    };
    
    // Start token refill process
    refillTokens();
    
    do {
      let retryCount = 0;
      let success = false;
      do {
        try {
          if (availableTokens <= 0) {
            console.warn("Rate limit reached, waiting for tokens...");
            await sleep(1000); // Check every second for available tokens
            continue;
          }
          
          if (nextToken) {
            queryParams.NextToken = nextToken;
          } else {
            delete queryParams.NextToken;
          }

          const queryString = new URLSearchParams(queryParams).toString();
          const url = `${baseUrl}?${queryString}`;

          const response = await axios.get(url, {
            headers: {
              "x-amz-access-token": authTokens.access_token,
              "Content-Type": "application/json",
            },
          });

          const ordersData = response.data.payload.Orders || [];
          allOrders = allOrders.concat(ordersData);

          nextToken = response.data.payload.NextToken?.trim() || null;
          success = true;
          availableTokens--; // Consume a token
        } catch (error) {
          if (error.response && error.response.status === 429) {
            retryCount++;
            if (retryCount > maxRetries) {
              throw new Error("Max retries exceeded due to rate limiting");
            }
            const backoffTime = getExponentialBackoffTime(retryCount);
            console.warn(`Rate limited. Retrying in ${backoffTime / 1000} seconds...`);
            await sleep(backoffTime);
          } else {
            throw error;
          }
        }
      } while (!success && retryCount <= maxRetries);
    } while (nextToken && nextToken !== "null");

    const values = allOrders.map((order) => ({
      BuyerInfo: order.BuyerInfo,
      AmazonOrderId: order.AmazonOrderId,
      EarliestShipDate: order.EarliestShipDate,
      SalesChannel: order.SalesChannel,
      OrderStatus: order.OrderStatus,
      NumberOfItemsShipped: order.NumberOfItemsShipped,
      OrderType: order.OrderType,
      IsPremiumOrder: order.IsPremiumOrder,
      IsPrime: order.IsPrime,
      FulfillmentChannel: order.FulfillmentChannel,
      NumberOfItemsUnshipped: order.NumberOfItemsUnshipped,
      HasRegulatedItems: order.HasRegulatedItems,
      IsReplacementOrder: order.IsReplacementOrder,
      IsSoldByAB: order.IsSoldByAB,
      LatestShipDate: order.LatestShipDate,
      ShipServiceLevel: order.ShipServiceLevel,
      IsISPU: order.IsISPU,
      MarketplaceId: order.MarketplaceId,
      PurchaseDate: order.PurchaseDate,
      ShippingAddress: order.ShippingAddress,
      IsAccessPointOrder: order.IsAccessPointOrder,
      SellerOrderId: order.SellerOrderId,
      PaymentMethod: order.PaymentMethod,
      IsBusinessOrder: order.IsBusinessOrder,
      OrderTotal: order.OrderTotal,
      PaymentMethodDetails: order.PaymentMethodDetails,
      IsGlobalExpressEnabled: order.IsGlobalExpressEnabled,
      LastUpdateDate: order.LastUpdateDate,
      ShipmentServiceLevelCategory: order.ShipmentServiceLevelCategory,
    }));

    res.status(200).json(values);
  } catch (error) {
    console.error(`Error getting orders: ${error.message}`);
    res.status(500).json({ message: "Error getting orders", error: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const authTokens = await authenticate();

    const orderId = req.query.id;

    const url = `${endpoint}/orders/v0/orders/${orderId}/orderItems/buyerInfo`;
    const response = await axios.get(url, {
      headers: {
        "x-amz-access-token": authTokens.access_token,
        "Content-Type": "application/json",
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error getting order", error: error });
  }
};

const createShipment = async (req, res) => {
  try {
    const authTokens = await authenticate();

    const url = `${endpoint}/shipping/v1/shipments`;
    await axios
      .post(
        url,
        shipmentData(), // This data is contained in shipmentData function in the amz utils
        {
          headers: {
            "Content-Type": "application/json",
            "x-amz-access-token": authTokens.access_token,
          },
        }
      )
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error creating shipment",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error creating Shipment", error: error });
  }
};

const getShipment = async (req, res) => {
  const shipmentId = req.query.id;

  try {
    const authTokens = await authenticate();

    await axios
      .get(`${endpoint}/shipping/v1/shipments/${shipmentId}`, {
        headers: {
          "x-amz-access-token": authTokens.access_token,
        },
      })
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error getting shipment",
          error: error.response.data,
        });
      });
  } catch (error) {
    console.error("Error getting shipment:", error.message);
    res.status(500).json({ message: "Error getting shipment", error: error });
  }
};

const cancelShipment = async (req, res) => {
  const shipmentId = req.query.id;
  try {
    const authTokens = await authenticate();

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-amz-access-token": authTokens.access_token,
    };

    await axios
      .post(
        `${endpoint}/shipping/v1/shipments/${shipmentId}/cancel`,
        {},
        { headers: headers }
      )
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error cancelling shipment",
          error: error.response.data,
        });
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error cancelling shipment", error: error });
  }
};

const purchaseLabel = async (req, res) => {
  const shipmentId = req.query.id;

  try {
    const authTokens = await authenticate();

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-amz-access-token": authTokens.access_token,
    };

    await axios
      .post(
        `${endpoint}/shipping/v1/shipments/${shipmentId}/purchaseLabels`,
        {
          rateId: "rate identifier",
          labelSpecification: {
            labelFormat: "PNG",
            labelStockSize: "4x6",
          },
        },
        { headers: headers }
      )
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error purchasing label",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error purchasing label", error: error });
  }
};

const getFeeds = async (req, res) => {
  try {
    const authTokens = await authenticate();

    const url = `${endpoint}/feeds/2021-06-30/feeds?feedTypes=POST_PRODUCT_DATA`; // e.g for POST_PRODUCT_DATA
    await axios
      .get(url, {
        headers: {
          "Content-Type": "application/json",
          "x-amz-access-token": authTokens.access_token,
        },
      })
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error getting feeds",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error getting feeds", error: error });
  }
};

const createFeed = async (req, res) => {
  try {
    const feedDocument = await createFeedDocument();
    const authTokens = await authenticate();

    // console.log('created document', feedDocument);

    await uploadFeed(feedDocument.url);

    axios
      .post(
        `${endpoint}/feeds/2021-06-30/feeds`,
        {
          feedType: "POST_PRODUCT_DATA",
          marketplaceIds: marketplaceIds,
          inputFeedDocumentId: feedDocument.feedDocumentId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-amz-access-token": authTokens.access_token,
          },
        }
      )
      .then((response) => {
        axios
          .get(`${endpoint}/feeds/2021-06-30/feeds/${response.data.feedId}`, {
            headers: {
              "Content-Type": "application/json",
              "x-amz-access-token": authTokens.access_token,
            },
          })
          .then((result) => {
            res.json({
              result,
            });
          })
          .catch((err) => {
            res.status(500).json({ error: err });
          });
      })
      .catch((error) => {
        res.status(500).json({ error: error.response.data });
      });
  } catch (error) {
    res.status(500).json({ message: "Error creating Feeds", error: error });
  }
};

const getListingItems = async (req, res) => {
  try {
    const authTokens = await authenticate();

    const url = `${endpoint}/listings/2021-08-01/items/${process.env.AMZ_SELLER_ID}/${sku}?marketplaceIds=${marketplace_id}&issueLocale=en_US&includedData=issues,attributes,summaries,offers,fulfillmentAvailability`;
    await axios
      .get(url, {
        headers: {
          "Content-Type": "application/json",
          "x-amz-access-token": authTokens.access_token,
        },
      })
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error getting Listings Items",
          error: error.response.data,
        });
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting Listings Items", error: error });
  }
};

const putListing = async (req, res) => {
  try {
    const authTokens = await authenticate();

    // TODO: Confirm url for put listing. DONE.
    const url = `${endpoint}/listings/2021-08-01/items/${process.env.AMZ_SELLER_ID}/${sku}?marketplaceIds=${marketplace_id}&issueLocale=en_US`;
    await axios
      .put(url, listingData(marketplace_id), {
        headers: {
          "Content-Type": "application/json",
          "x-amz-access-token": authTokens.access_token,
        },
      })
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error Putting Listing",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error Putting Listing", error: error });
  }
};

const patchListing = async (req, res) => {
  try {
    const authTokens = await authenticate();

    const url = `${endpoint}/listings/2021-08-01/items/${process.env.AMZ_SELLER_ID}/${sku}?marketplaceIds=${marketplace_id}&issueLocale=en_US`;
    await axios
      .patch(url, patchListingData(marketplace_id), {
        headers: {
          "Content-Type": "application/json",
          "x-amz-access-token": authTokens.access_token,
        },
      })
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error patching Listing",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error patching Listing", error: error });
  }
};

const deleteListing = async (req, res) => {
  try {
    const authTokens = await authenticate();

    const url = `${endpoint}/listings/2021-08-01/items/${process.env.AMZ_SELLER_ID}/${sku}?marketplaceIds=${marketplace_id}&issueLocale=en_US`;
    await axios
      .delete(url, {
        headers: {
          "Content-Type": "application/json",
          "x-amz-access-token": authTokens.access_token,
        },
      })
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error Deleting Listing",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error Deleting Listing", error: error });
  }
};

const getInventory = async (req, res) => {
  const { marketplaceids } = req.query;
  console.log("MarketPlaceId", marketplaceids);

  try {
    const authTokens = await authenticate();
    const baseUrl = `${endpoint}/fba/inventory/v1/summaries`;

    const queryParams = {
      details: "true",
      granularityType: "Marketplace",
      granularityId: marketplaceids,
      marketplaceIds: marketplaceids,
    };

    let allInventoryData = [];
    let nextToken = null;
    let retryCount = 0;
    const maxRetries = 5;

    do {
      if (nextToken) {
        queryParams.nextToken = nextToken;
      } else {
        delete queryParams.nextToken; // Ensure it's removed on the first request
      }

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `${baseUrl}?${queryString}`;

      try {
        const response = await axios.get(url, {
          headers: {
            "x-amz-access-token": authTokens.access_token,
            "Content-Type": "application/json",
          },
        });

        const inventoryData = response.data.payload.inventorySummaries || [];
        allInventoryData = allInventoryData.concat(inventoryData);

        // Ensure nextToken exists and is valid before continuing
        nextToken = response.data.pagination?.nextToken?.trim() || null;

        retryCount = 0; // Reset retry count on successful request
      } catch (error) {
        if (error.response && error.response.status === 429) {
          retryCount++;
          if (retryCount > maxRetries) {
            throw new Error("Max retries exceeded");
          }
          const retryAfter =
            error.response.headers["retry-after"] || Math.pow(2, retryCount);
          console.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000)
          );
        } else {
          throw error;
        }
      }
    } while (nextToken && nextToken !== "null");

    console.log("Final nextToken:", nextToken);

    const values = allInventoryData.map((item) => ({
      ASIN: item.asin,
      productName: item.productName,
      fnsku: item.fnSku,
      sellersku: item.sellerSku,
      fulfillableQuantity: item.inventoryDetails.fulfillableQuantity,
      inboundWorkingQuantity: item.inventoryDetails.inboundWorkingQuantity,
      inboundShippedQuantity: item.inventoryDetails.inboundShippedQuantity,
      inboundReceivingQuantity: item.inventoryDetails.inboundReceivingQuantity,
      totalReservedQuantity:
        item.inventoryDetails.reservedQuantity.totalReservedQuantity,
      pendingCustomerOrderQuantity:
        item.inventoryDetails.reservedQuantity.pendingCustomerOrderQuantity,
      pendingTransshipmentQuantity:
        item.inventoryDetails.reservedQuantity.pendingTransshipmentQuantity,
      fcProcessingQuantity:
        item.inventoryDetails.reservedQuantity.fcProcessingQuantity,
      totalResearchingQuantity:
        item.inventoryDetails.researchingQuantity.totalResearchingQuantity,
      researchingQuantityInShortTerm:
        item.inventoryDetails.researchingQuantity.researchingQuantityBreakdown.find(
          (q) => q.name === "researchingQuantityInShortTerm"
        )?.quantity || 0,
      researchingQuantityInMidTerm:
        item.inventoryDetails.researchingQuantity.researchingQuantityBreakdown.find(
          (q) => q.name === "researchingQuantityInMidTerm"
        )?.quantity || 0,
      totalUnfulfillableQuantity:
        item.inventoryDetails.unfulfillableQuantity.totalUnfulfillableQuantity,
      customerDamagedQuantity:
        item.inventoryDetails.unfulfillableQuantity.customerDamagedQuantity,
      warehouseDamagedQuantity:
        item.inventoryDetails.unfulfillableQuantity.warehouseDamagedQuantity,
      distributorDamagedQuantity:
        item.inventoryDetails.unfulfillableQuantity.distributorDamagedQuantity,
      carrierDamagedQuantity:
        item.inventoryDetails.unfulfillableQuantity.carrierDamagedQuantity,
      defectiveQuantity:
        item.inventoryDetails.unfulfillableQuantity.defectiveQuantity,
      expiredQuantity:
        item.inventoryDetails.unfulfillableQuantity.expiredQuantity,
      reservedFutureSupplyQuantity:
        item.inventoryDetails.futureSupplyQuantity.reservedFutureSupplyQuantity,
      futureSupplyBuyableQuantity:
        item.inventoryDetails.futureSupplyQuantity.futureSupplyBuyableQuantity,
    }));

    res.status(200).json(values);
  } catch (error) {
    console.error(
      "Error getting inventory:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ message: "Error getting inventory", error: error });
  }
};

module.exports = {
  auth,
  getOrders,
  getOrder,
  createShipment,
  getShipment,
  cancelShipment,
  purchaseLabel,
  getFeeds,
  createFeed,
  getListingItems,
  putListing,
  patchListing,
  deleteListing,
  getInventory,
};

// 'A13V1IB3VIYZZH': 'France',
//   'APJ6JRA9NG5V4': 'Italy',
//   'A1RKKUPIHCS9HS': 'Spain',
//   'AMEN7PMS3EDWL': 'Belgium',
//   'A1PA6795UKMFR9': 'Germany',
//   'A1805IZSGTT6HS': 'Netherlands',
//   'A1F83G8C2ARO7P': 'United Kingdom',
//   'A1C3SOZRARQ6R3': 'Poland',
//   'A2NODRKZP88ZB9': 'Sweden'
// }
