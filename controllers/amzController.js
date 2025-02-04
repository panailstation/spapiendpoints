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

const marketplaceSheetMap = {
  'A13V1IB3VIYZZH': 'Sheet1',
  'APJ6JRA9NG5V4': 'Sheet2',
  'A1RKKUPIHCS9HS': 'Sheet3',
  'AMEN7PMS3EDWL': 'Sheet4',
  'A1PA6795UKMFR9': 'Sheet5',
  'A1805IZSGTT6HS': 'Sheet6',
  'A1F83G8C2ARO7P': 'Sheet7',
  'A1C3SOZRARQ6R3': 'Sheet8',
  'A2NODRKZP88ZB9': 'Sheet9'  
};

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

const getOrders = async (req, res) => {
  try {
    const createdAfter = moment().subtract(30, "days").toISOString();

    const authTokens = await authenticate();

    const url = `${endpoint}/orders/v0/orders?MarketplaceIds=${marketplace_id}&CreatedAfter=${createdAfter}&MaxResultPerPage=2`;
    const response = await axios.get(url, {
      headers: {
        "x-amz-access-token": authTokens.access_token,
        "Content-Type": "application/json",
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error getting orders", error: error });
  }
};

const getOrder = async (req, res) => {
  try {
    const authTokens = await authenticate();

    const orderId = req.query.id;

    const url = `${endpoint}/orders/v0/orders/${orderId}/`;
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

// const getInventory = async (req, res) => {
//   const { marketplaceids } = req.query;

//   console.log("MarketPlaceId", marketplaceids);

//   try {
//     const authTokens = await authenticate();
//     // Define the base URL
//     const baseUrl = `${endpoint}/fba/inventory/v1/summaries`;

//     // Define the query parameters
//     const queryParams = {
//       details: "true",
//       granularityType: "Marketplace",
//       granularityId: marketplaceids,
//       marketplaceIds: marketplaceids,
//     };

//     // Convert the query parameters to a URL-encoded string
//     const queryString = new URLSearchParams(queryParams).toString();

//     // Construct the full URL
//     const url = `${baseUrl}?${queryString}`;

//     // console.log("Request URL:", url); 

//     const response = await axios.get(url, {
//       headers: {
//         "x-amz-access-token": authTokens.access_token,
//         "Content-Type": "application/json",
//       },
//     });

//     const inventoryData = response.data.payload.inventorySummaries;

//     // Authenticate with Google Sheets API
//     const auth = new google.auth.GoogleAuth({
//       credentials: {
//         client_email: process.env.GOOGLE_CLIENT_EMAIL,
//         private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//       },
//       scopes: "https://www.googleapis.com/auth/spreadsheets",
//     });

//     const client = await auth.getClient();
//     const googleSheets = google.sheets({ version: "v4", auth: client });

//     // Determine the sheet name based on the marketplace ID
//     const sheetName = marketplaceSheetMap[marketplaceids];

//     console.log("sheet name:", sheetName)

//     if (!sheetName) {
//       return res.status(400).json({ message: "Invalid marketplace ID" });
//     }

//     // Prepare the data to be appended
//     const values = inventoryData.map((item) => [
//       item.asin,
//       item.productName,
//       item.fnSku,
//       item.sellerSku,
//       item.inventoryDetails.fulfillableQuantity,
//       item.inventoryDetails.inboundWorkingQuantity,
//       item.inventoryDetails.inboundShippedQuantity,
//       item.inventoryDetails.inboundReceivingQuantity,
//       item.inventoryDetails.reservedQuantity.totalReservedQuantity,
//       item.inventoryDetails.reservedQuantity.pendingCustomerOrderQuantity,
//       item.inventoryDetails.reservedQuantity.pendingTransshipmentQuantity,
//       item.inventoryDetails.reservedQuantity.fcProcessingQuantity,
//       item.inventoryDetails.researchingQuantity.totalResearchingQuantity,
//       item.inventoryDetails.researchingQuantity.researchingQuantityBreakdown.find(
//         (q) => q.name === "researchingQuantityInShortTerm"
//       )?.quantity || 0,
//       item.inventoryDetails.researchingQuantity.researchingQuantityBreakdown.find(
//         (q) => q.name === "researchingQuantityInMidTerm"
//       )?.quantity || 0,
//       item.inventoryDetails.unfulfillableQuantity.totalUnfulfillableQuantity,
//       item.inventoryDetails.unfulfillableQuantity.customerDamagedQuantity,
//       item.inventoryDetails.unfulfillableQuantity.warehouseDamagedQuantity,
//       item.inventoryDetails.unfulfillableQuantity.distributorDamagedQuantity,
//       item.inventoryDetails.unfulfillableQuantity.carrierDamagedQuantity,
//       item.inventoryDetails.unfulfillableQuantity.defectiveQuantity,
//       item.inventoryDetails.unfulfillableQuantity.expiredQuantity,
//       item.inventoryDetails.futureSupplyQuantity.reservedFutureSupplyQuantity,
//       item.inventoryDetails.futureSupplyQuantity.futureSupplyBuyableQuantity,
//     ]);

//     const spreadsheetId = process.env.SPREAD_SHEETS_ID;

//     // Clear the sheet content starting from the third row
//     await googleSheets.spreadsheets.values.clear({
//       spreadsheetId,
//       range: `${sheetName}!A3:Z`,
//     });

//     // Write row(s) to spreadsheet starting from the third row
//     await googleSheets.spreadsheets.values.append({
//       auth,
//       spreadsheetId,
//       range: `${sheetName}!A3`,
//       valueInputOption: "RAW",
//       resource: {
//         values,
//       },
//     });

//     res.status(200).json(inventoryData);
//   } catch (error) {
//     // Log the error for debugging
//     console.error(
//       "Error getting inventory:",
//       error.response ? error.response.data : error.message
//     );

//     res.status(500).json({ message: "Error getting inventory", error: error });
//   }
// };

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

    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${baseUrl}?${queryString}`;

    const response = await axios.get(url, {
      headers: {
        "x-amz-access-token": authTokens.access_token,
        "Content-Type": "application/json",
      },
    });

    const inventoryData = response.data.payload.inventorySummaries;

    const values = inventoryData.map((item) => ({
      ASIN: item.asin,
      productName: item.productName,
      fnsku: item.fnSku,
      sellersku: item.sellerSku,
      fulfillableQuantity: item.inventoryDetails.fulfillableQuantity,
      inboundWorkingQuantity: item.inventoryDetails.inboundWorkingQuantity,
      inboundShippedQuantity: item.inventoryDetails.inboundShippedQuantity,
      inboundReceivingQuantity: item.inventoryDetails.inboundReceivingQuantity,
      totalReservedQuantity: item.inventoryDetails.reservedQuantity.totalReservedQuantity,
      pendingCustomerOrderQuantity: item.inventoryDetails.reservedQuantity.pendingCustomerOrderQuantity,
      pendingTransshipmentQuantity: item.inventoryDetails.reservedQuantity.pendingTransshipmentQuantity,
      fcProcessingQuantity: item.inventoryDetails.reservedQuantity.fcProcessingQuantity,
      totalResearchingQuantity: item.inventoryDetails.researchingQuantity.totalResearchingQuantity,
      researchingQuantityInShortTerm: item.inventoryDetails.researchingQuantity.researchingQuantityBreakdown.find(
        (q) => q.name === "researchingQuantityInShortTerm"
      )?.quantity || 0,
      researchingQuantityInMidTerm: item.inventoryDetails.researchingQuantity.researchingQuantityBreakdown.find(
        (q) => q.name === "researchingQuantityInMidTerm"
      )?.quantity || 0,
      totalUnfulfillableQuantity: item.inventoryDetails.unfulfillableQuantity.totalUnfulfillableQuantity,
      customerDamagedQuantity: item.inventoryDetails.unfulfillableQuantity.customerDamagedQuantity,
      warehouseDamagedQuantity: item.inventoryDetails.unfulfillableQuantity.warehouseDamagedQuantity,
      distributorDamagedQuantity: item.inventoryDetails.unfulfillableQuantity.distributorDamagedQuantity,
      carrierDamagedQuantity: item.inventoryDetails.unfulfillableQuantity.carrierDamagedQuantity,
      defectiveQuantity: item.inventoryDetails.unfulfillableQuantity.defectiveQuantity,
      expiredQuantity: item.inventoryDetails.unfulfillableQuantity.expiredQuantity,
      reservedFutureSupplyQuantity: item.inventoryDetails.futureSupplyQuantity.reservedFutureSupplyQuantity,
      futureSupplyBuyableQuantity: item.inventoryDetails.futureSupplyQuantity.futureSupplyBuyableQuantity,
    }));

    res.status(200).json(values);
  } catch (error) {
    console.error("Error getting inventory:", error.response ? error.response.data : error.message);
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

// [
//   'A13V1IB3VIYZZH',
//   'APJ6JRA9NG5V4',
//   'A1RKKUPIHCS9HS',
//   'AMEN7PMS3EDWL',
//   'A1PA6795UKMFR9',
//   'A1805IZSGTT6HS',
//   'A1F83G8C2ARO7P',
//   'A1C3SOZRARQ6R3',
//   'A2NODRKZP88ZB9'
// ]
