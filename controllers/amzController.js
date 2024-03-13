const axios = require("axios");
const moment = require("moment");
const os = require("os");
const SellingPartnerAPI = require("amazon-sp-api");

const config = {
    region: "na", // Required: The region to use for the SP-API endpoints. Must be one of: "eu", "na" or "fe"
    refresh_token: process.env.REFRESH_TOKEN, // Optional: The refresh token of your router user. Required if "only_grantless_operations" option is set to "false".
    endpoints_versions: {
        // Optional: Defines the version to use for an endpoint as key/value pairs, i.e. "reports":"2021-06-30".
        reports: "2021-06-30",
    },
    credentials: {
        // Optional: The app client and aws user credentials. Should only be used if you have no means of using environment vars or credentials file!
        SELLING_PARTNER_APP_CLIENT_ID: process.env.SELLING_PARTNER_APP_CLIENT_ID,
        SELLING_PARTNER_APP_CLIENT_SECRET: process.env.SELLING_PARTNER_APP_CLIENT_SECRET,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        AWS_SELLING_PARTNER_ROLE: process.env.AWS_SELLING_PARTNER_ROLE,
    },
    options: {
        credentials_path: "~/.amzspapi/credentials", // Optional: A custom absolute path to your credentials file location.
        auto_request_tokens: true, // Optional: Whether or not the client should retrieve new access and role credentials if non given or expired.
        auto_request_throttled: true, // Optional: Whether or not the client should automatically retry a request when throttled.
        version_fallback: true, // Optional: Whether or not the client should try to use an older version of an endpoint if the operation is not defined for the desired version.
        use_sandbox: false, // Optional: Whether or not to use the sandbox endpoint.
        only_grantless_operations: false, // Optional: Whether or not to only use grantless operations.
        user_agent: `amazon-sp-api/2012-10-17 (Language=Node.js/v18.12.1; Platform=${os.platform()}/${os.release()})`, // A custom user-agent header.
        debug_log: false, // Optional: Whether or not the client should print console logs for debugging purposes.
        timeouts: {
            response: 0, // Optional: The time in milliseconds until a response timeout is fired (time between starting the request and receiving the first byte of the response).
            idle: 0, // Optional: The time in milliseconds until an idle timeout is fired (time between receiving the last chunk and receiving the next chunk).
            deadline: 0, // Optional: The time in milliseconds until a deadline timeout is fired (time between starting the request and receiving the full response).
        },
    },
};

let sellingPartner = new SellingPartnerAPI(config);

const endpoints = async (req, res) => {
    res.json({
        endpoints: sellingPartner.endpoints, // This will return all the endpoints that are available
    });
}

const catalogueItems = async (req, res) => {
    const endpoint = 'catalogItems';

    try {
        let getCatalogItem = await sellingPartner.callAPI({
            operation: "getCatalogItem",
            endpoint: endpoint,
            path: {
                asin: "asin", // your asin
            },
            query: {
                marketplaceIds: [], // an array of market place IDs
                includedData: [
                    "identifiers",
                    "images",
                    "productTypes",
                    "salesRanks",
                    "summaries",
                    "variations",
                ],
            },
            options: {
                version: "2020-12-01", // This is just version
            },
        });

        let listCatalogCategoriesv1 = await sellingPartner.callAPI({
            operation: "listCatalogCategories",
            endpoint: endpoint,
            query: {
                MarketplaceId: "marketplace_id", // Your marketplace_id
                ASIN: "asin", // Your ASIN
            },
            options: {
                version: "2020-12-01",
            },
        });

        let listCatalogCategoriesv2 = await sellingPartner.callAPI({
            operation: 'listCatalogCategories',
            endpoint: endpoint,
            query: {
                MarketplaceId: "marketplace_id",
                ASIN: "asin"
            },
            options: {
                version: '2020-12-01'
            }
        });

        let listCatalogCategoriesv3 = await sellingPartner.callAPI({
            operation: 'listCatalogCategories',
            endpoint: endpoint,
            query: {
                MarketplaceId: "marketplace_id",
                SellerSKU: "sku"
            }
        });

        let searchCatalogItems = await sellingPartner.callAPI({
            operation: 'searchCatalogItems',
            endpoint: endpoint,
            query: {
                keywords: ['echo dot'], // can be an array of strings as many as possible
                marketplaceIds: "marketplace_id",
                includedData: ['identifiers', 'images', 'productTypes', 'salesRanks', 'summaries', 'variations']
            }
        });

        let searchCatalogItemsv2 = await sellingPartner.callAPI({
            operation: 'searchCatalogItems',
            endpoint: endpoint,
            query: {
                identifiers: ["sku"], // an array of skus
                identifiersType: 'SKU',
                marketplaceIds: ["marketplace_id"], // an array of market place ids
                sellerId: seller_id,
                includedData: ['images']
            },
            options: {
                version: '2022-04-01'
            }
        });

        let getCatalogItemv2 = await sellingPartner.callAPI({
            operation: 'getCatalogItem',
            endpoint: endpoint,
            path: {
                asin: asin // asin
            },
            query: {
                marketplaceIds: ["marketplace_id"] // an array of marketplaceIds
            },
            options: {
                version: '2022-04-01'
            }
        });

        res.json({
            payload: {
                getCatalogItem, // should return a catalog item (2020-12-01)
                listCatalogCategoriesv1, // should return the parent categories of asin
                listCatalogCategoriesv2, // should return the parent categories of asin by version fallback
                listCatalogCategoriesv3, // should return the parent categories of sku
                searchCatalogItems, // should return 20 catalog items for keyword
                searchCatalogItemsv2, // should return a catalog item (2022-04-01) for SKU
                getCatalogItemv2, // should return a catalog item (2022-04-01)
            },
        });
    } catch (err) {
        res.json({
            error: err,
        });
    }
}

const finances = async (req, res) => {
    const endpoint = "finances";
    try {
        let listFinancialEventGroups = await sellingPartner.callAPI({
            operation: "listFinancialEventGroups",
            endpoint: endpoint,
            query: {
                FinancialEventGroupStartedBefore: moment().startOf("day").toISOString(),
                FinancialEventGroupStartedAfter: moment()
                    .startOf("day")
                    .subtract(2, "months")
                    .toISOString(),
            },
        });

        let listFinancialEventsByGroupId = await sellingPartner.callAPI({
            operation: 'listFinancialEventsByGroupId',
            endpoint: endpoint,
            path: {
                eventGroupId: "event_group_id"
            }
        });

        let listFinancialEventsByOrderId = await sellingPartner.callAPI({
            operation: 'listFinancialEventsByOrderId',
            endpoint: endpoint,
            path: {
                orderId: "order_id"
            }
        });

        res.json({
            payload: {
                listFinancialEventGroups, // should return financial event groups for date range
                listFinancialEventsByGroupId, //should return financial events for event group
                listFinancialEventsByOrderId, // should return financial events for order
            },
        });
    } catch (error) {
        res.json({
            error: error
        })
    }
}

const getListingItems = async (req, res) => {
    const endpoint = 'listingsItems';

    try {
        let getListingsItem = await sellingPartner.callAPI({
            operation: "getListingsItem",
            endpoint: endpoint,
            path: {
                sellerId: "", // Your seller ID
                sku: "sku", //Your sku
            },
            query: {
                marketplaceIds: "", // Your marketplace Id
            },
        });

        res.json({
            payload: {
                getListingsItem // should return a not found error for special chars sku     
            },
        });
    } catch (err) {
        res.json({
            error: err,
        });
    }
}

const messaging = async (req, res) => {
    const endpoint = 'messaging';
    try {
        let getMessagingActionsForOrder = await sellingPartner.callAPI({
            operation: 'getMessagingActionsForOrder',
            endpoint: endpoint,
            path: {
                amazonOrderId: "order_id"
            },
            query: {
                marketplaceIds: "marketplace_id"
            }
        });

        let getAttributes = await sellingPartner.callAPI({
            operation: 'GetAttributes',
            endpoint: endpoint,
            path: {
                amazonOrderId: "order_id"
            },
            query: {
                marketplaceIds: "marketplace_id"
            }
        });


        res.json({
            payload: {
                getMessagingActionsForOrder, // should return available messaging types for order
                getAttributes, // should return attributes for order
            }
        })
    } catch (error) {
        res.json({
            error: error
        })
    }
}

const notifications = async (req, res) => {
    const endpoint = 'notifications';
    const sellingPartner = new SellingPartnerAPI({
        region: "region", // Add your parameters here
        refresh_token: "refresh_token", // Add your parameters here
        access_token: "access_token", // Add your parameters here
        role_credentials: "role_credentials", // Add your parameters here
        options: {
            auto_request_tokens: false
        }
    });

    try {
        await sellingPartner.refreshAccessToken('sellingpartnerapi::notifications');
        let getSubscription = await sellingPartner.callAPI({
            operation: 'getSubscription',
            endpoint: endpoint,
            path: {
                notificationType: 'ANY_OFFER_CHANGED'
            }
        });

        let getSubscriptionById = await sellingPartner.callAPI({
            operation: 'getSubscriptionById',
            endpoint: endpoint,
            path: {
                subscriptionId: subscription_id,
                notificationType: 'ANY_OFFER_CHANGED'
            }
        });

        let getDestinations = await sellingPartner.callAPI({
            operation: 'getDestinations',
            endpoint: endpoint,
        });

        let getDestination = await sellingPartner.callAPI({
            operation: 'getDestination',
            endpoint: endpoint,
            path: {
                destinationId: "destination_id" // add a destination id
            }
        });

        res.json({
            payload: {
                getSubscription, // should return subscriptions for any offer changed
                getSubscriptionById, // should return subscriptions for subscription id
                getDestinations, // should return destinations
                getDestination, // should return destination for destination id
            }
        })
    } catch (error) {
        res.json({
            error: error
        })
    }
}

const orders = async (req, res) => {
    const endpoint = 'orders';

    try {
        let getOrders = await sellingPartner.callAPI({
            operation: 'getOrders',
            endpoint: endpoint,
            query: {
                MarketplaceIds: "marketplace_id", // your marketplace id
                CreatedBefore: moment().startOf('day').toISOString(),
                CreatedAfter: moment().startOf('day').subtract(1, 'month').toISOString()
            }
        });
        let getOrder = await sellingPartner.callAPI({
            operation: 'getOrder',
            endpoint: endpoint,
            path: {
                orderId: "order_id" // pass an order id
            }
        });
        let getOrderBuyerInfo = await sellingPartner.callAPI({
            operation: 'getOrderBuyerInfo',
            endpoint: endpoint,
            path: {
                orderId: "order_id" // pass order id
            }
        });
        let getOrderAddress = await sellingPartner.callAPI({
            operation: 'getOrderAddress',
            endpoint: endpoint,
            path: {
                orderId: "order_id" // pass order id
            }
        });
        let getOrderItems = await sellingPartner.callAPI({
            operation: 'getOrderItems',
            endpoint: endpoint,
            path: {
                orderId: "order_id" // pass order id
            }
        });
        let getOrderItemsBuyerInfo = await sellingPartner.callAPI({
            operation: 'getOrderItemsBuyerInfo',
            endpoint: endpoint,
            path: {
                orderId: "order_id" // pass order id
            }
        });

        res.json({
            payload: {
                getOrders, // should return orders created in date range for marketplace
                getOrder, // should return order for order id
                getOrderBuyerInfo, // should return buyer information for order id
                getOrderAddress, // should return buyer information for order id
                getOrderItems, // should return order item information for order id
                getOrderItemsBuyerInfo, // should return buyer information in order items for order id
            }
        })
    } catch (error) {
        res.json({
            error: error
        })
    }
}

const productFees = async (req, res) => {
    const endpoint = 'productFees';

    try {

        let getMyFeesEstimateForSKU = await sellingPartner.callAPI({
            operation: 'getMyFeesEstimateForSKU',
            endpoint: endpoint,
            path: {
                SellerSKU: "sku" // sku
            },
            body: {
                FeesEstimateRequest: {
                    MarketplaceId: "marketplace_id", // marketplaceid
                    Identifier: "sku", // sku
                    PriceToEstimateFees: {
                        ListingPrice: {
                            CurrencyCode: "currency_code", // pass currency code
                            Amount: 19.99 // pass amount
                        }
                    }
                }
            }
        });

        let getMyFeesEstimateForASIN = await sellingPartner.callAPI({
            operation: 'getMyFeesEstimateForASIN',
            endpoint: endpoint,
            path: {
                Asin: "asin" // asin
            },
            body: {
                FeesEstimateRequest: {
                    MarketplaceId: "marketplace_id", // pass your parameter here
                    Identifier: "asin", // pass your parameter here
                    PriceToEstimateFees: {
                        ListingPrice: {
                            CurrencyCode: "currency_code", // pass your parameter here
                            Amount: 19.99 // pass amount
                        }
                    }
                }
            }
        });

        let getMyFeesEstimates = await sellingPartner.callAPI({
            operation: 'getMyFeesEstimates',
            endpoint: endpoint,
            body: [{
                FeesEstimateRequest: {
                    MarketplaceId: "marketplace_id", // pass your parameter
                    Identifier: "sku", // pass your parameter
                    PriceToEstimateFees: {
                        ListingPrice: {
                            CurrencyCode: "currency_code", // pass your parameter
                            Amount: 19.99
                        }
                    }
                },
                IdType: 'SellerSKU',
                IdValue: "sku" // pass sku here
            }, {
                FeesEstimateRequest: {
                    MarketplaceId: "marketplace_id", // pass your paramaters here
                    Identifier: "asin", // pass your paramaters here
                    PriceToEstimateFees: {
                        ListingPrice: {
                            CurrencyCode: "currency_code", // pass your paramaters here
                            Amount: 19.99
                        }
                    }
                },
                IdType: 'ASIN',
                IdValue: "sain" // pass asin here
            }]
        });

        res.json({
            payload: {
                getMyFeesEstimateForSKU, // should return estimated product fees for sku
                getMyFeesEstimateForASIN, // should return estimated product fees for asin
                getMyFeesEstimates, // should return estimated product fees for sku and asin
            }
        })
    } catch (error) {
        res.json({
            error: error
        })
    }
}

const productPricing = async (req, res) => {
    const endpoint = 'productPricing';

    try {

        let getPricing = await sellingPartner.callAPI({
            operation: 'getPricing',
            endpoint: endpoint,
            query: {
                MarketplaceId: "marketplace_id", // replace with your parameter
                Asins: "asin", // replace with your parameter
                ItemType: 'Asin'
            }
        });

        let getPricingv2 = await sellingPartner.callAPI({
            operation: 'getPricing',
            endpoint: endpoint,
            query: {
                MarketplaceId: "marketplace_id", // pass your parameter here
                Asins: ["asins"], // make this an array of asins
                ItemType: 'Asin'
            }
        });

        let getPricingv3 = await sellingPartner.callAPI({
            operation: 'getPricing',
            endpoint: endpoint,
            query: {
                MarketplaceId: "marketplace_id", // pass your parameter
                Skus: "sku", // pass your parameter
                ItemType: 'Sku'
            }
        });

        let getPricingv4 = await sellingPartner.callAPI({
            operation: 'getPricing',
            endpoint: endpoint,
            query: {
                MarketplaceId: "marketplace_id", // pass your parameter
                Skus: ["skus"], // this should be an array of skus
                ItemType: 'Sku'
            }
        });

        let getCompetitivePricing = await sellingPartner.callAPI({
            operation: 'getCompetitivePricing',
            endpoint: endpoint,
            query: {
                MarketplaceId: "marketplace_id", // pass your parameter
                Asins: "asin", // pass your parameter
                ItemType: 'Asin'
            }
        });

        let getCompetitivePricingv2 = await sellingPartner.callAPI({
            operation: 'getCompetitivePricing',
            endpoint: endpoint,
            query: {
                MarketplaceId: "marketplace_id", // pass your parameters
                Skus: ["sku"], // pass your parameters. this has to be an array also
                ItemType: 'Sku'
            }
        });

        let getListingOffers = await sellingPartner.callAPI({
            operation: 'getListingOffers',
            endpoint: endpoint,
            path: {
                SellerSKU: "sku",  // pass your parameter            
            },
            query: {
                MarketplaceId: "marketplace_id", // pass your parameter
                ItemCondition: 'New'
            }
        });

        let getItemOffers = await sellingPartner.callAPI({
            operation: 'getItemOffers',
            endpoint: endpoint,
            path: {
                Asin: "asin", // pass your parameter
            },
            query: {
                MarketplaceId: "marketplace_id", // pass your parameter
                ItemCondition: 'New'
            }
        });

        let getItemOffersBatch = await sellingPartner.callAPI({
            operation: 'getItemOffersBatch',
            endpoint: endpoint,
            body: {
                requests: [{
                    uri: '/products/pricing/v0/items/' + asin + '/offers', // pass your asin here
                    method: 'GET',
                    queryParams: {
                        MarketplaceId: "marketplace_id", // pass your parameter
                        ItemCondition: 'New'
                    }
                }]
            }
        });

        let getListingOffersBatch = await sellingPartner.callAPI({
            operation: 'getListingOffersBatch',
            endpoint: endpoint,
            body: {
                requests: [{
                    uri: '/products/pricing/v0/listings/' + sku + '/offers', // pass your sku here
                    method: 'GET',
                    queryParams: {
                        MarketplaceId: "marketplace_id", // pass your parameter
                        ItemCondition: 'New'
                    }
                }]
            }
        });

        let getPricingv5 = await sellingPartner.callAPI({
            operation: 'getPricing',
            endpoint: endpoint,
            query: {
                MarketplaceId: "marketplace_id", // pass your parameter
                Skus: ["skus"], // this should be an array of skus
                ItemType: 'Sku'
            }
        });

        res.json({
            payload: {
                getPricing, // should return pricing information for asin
                getPricingv2, // should return pricing information for asins array
                getPricingv3, // should return pricing information for sku
                getPricingv4, // should return pricing information for skus array
                getCompetitivePricing, // should return competitive pricing information for asin
                getCompetitivePricingv2, // should return competitive pricing information for sku
                getListingOffers, // should return lowest priced offers for sku
                getItemOffers, // should return lowest priced offers for asin
                getItemOffersBatch, // should return lowest priced offers for asin as batch request
                getListingOffersBatch, // should return lowest priced offers for sku as batch request
                getPricingv5, // should return ClientError status for special chars skus array
            }
        })
    } catch (error) {
        res.json({
            error: error
        })
    }
}

const reports = async (req, res) => {
    const endpoint = 'reports';

    try {
        let getReports = await sellingPartner.callAPI({
            operation: 'getReports',
            endpoint: endpoint,
            query: {
                reportTypes: 'GET_FLAT_FILE_OPEN_LISTINGS_DATA'
            }
        });

        let getReport = await sellingPartner.callAPI({
            operation: 'getReport',
            endpoint: endpoint,
            path: {
                reportId: "report_id" // pass a report id
            }
        });

        let getReportSchedules = await sellingPartner.callAPI({
            operation: 'getReportSchedules',
            endpoint: endpoint,
            query: {
                reportTypes: ['GET_FLAT_FILE_OPEN_LISTINGS_DATA']
            }
        });

        let getReportSchedule = await sellingPartner.callAPI({
            operation: 'getReportSchedule',
            endpoint: endpoint,
            path: {
                reportScheduleId: "report_schedule_id" // pass it's id
            }
        });

        let getReportDocument = await sellingPartner.callAPI({
            operation: 'getReportDocument',
            endpoint: endpoint,
            path: {
                reportDocumentId: "report_document_id" // pass a report document id
            }
        });

        let download = await sellingPartner.download("report_document", { // I added a string, add the report document to be downloaded
            json: true
        });

        res.json({
            payload: {
                getReports, // should return report details for open listings inventory reports
                getReport, // should return report details open listings inventory report id
                getReportSchedules, // should return report schedules for open listings inventory reports
                getReportSchedule, // should return report details for open listings inventory report schedule id
                getReportDocument, // should return report document for open listings inventory report document id

            }
        })
    } catch (error) {
        res.json({
            error: error
        })
    }
}

const sales = async (req, res) => {
    const endpoint = 'sales';

    try {
        let getOrderMetrics = await sellingPartner.callAPI({
            operation: 'getOrderMetrics',
            endpoint: endpoint,
            query: {
                marketplaceIds: "marketplace_id", // pass your marketplaceid
                interval: moment().startOf('day').subtract(1, 'month').toISOString() + '--' + moment().toISOString(),
                granularity: 'Day'
            }
        });

        res.json({
            paylaod: {
                getOrderMetrics, // should return order metrics for date range aggregated by day
            }
        })
    } catch (error) {
        res.json({
            error: error
        })
    }
}

const getShipments = async (req, res) => {
    const endpoint = 'fulfillmentInbound';

    try {

        let getShipments = await sellingPartner.callAPI({
            operation: 'getShipments',
            endpoint: endpoint,
            query: {
                MarketplaceId: "marketplace_id", // pass your parameter
                ShipmentStatusList: ['WORKING', 'SHIPPED', 'RECEIVING', 'CANCELLED', 'DELETED', 'CLOSED', 'ERROR', 'IN_TRANSIT', 'DELIVERED', 'CHECKED_IN'],
                QueryType: 'DATE_RANGE',
                LastUpdatedBefore: moment().startOf('day').toISOString(),
                LastUpdatedAfter: moment().startOf('day').subtract(2, 'months').toISOString()
            }
        });

        let getShipmentItemsByShipmentId = await sellingPartner.callAPI({
            operation: 'getShipmentItemsByShipmentId',
            endpoint: endpoint,
            query: {
                MarketplaceId: "marketplace_id", // pass your parameter
            },
            path: {
                shipmentId: "shipment_id" // pass your parameter
            }
        });

        let getShipmentItems = await sellingPartner.callAPI({
            operation: 'getShipmentItems',
            endpoint: endpoint,
            query: {
                MarketplaceId: "marketplace_id", // pass your parameter
                QueryType: 'DATE_RANGE',
                LastUpdatedBefore: moment().startOf('day').toISOString(),
                LastUpdatedAfter: moment().startOf('day').subtract(2, 'months').toISOString()
            }
        });

        res.json({
            payload: {
                getShipments, // should return inbound shipments for date range
                getShipmentItemsByShipmentId, // should return inbound shipment items for shipment
                getShipmentItems, // should return inbound shipment items for date range
            }
        })
    } catch (error) {
        res.json({
            error: error
        })
    }
}

const sellers = async (req, res) => {
    const endpoint = 'sellers';

    try {
        let getMarketplaceParticipations = await sellingPartner.callAPI({
            operation: 'getMarketplaceParticipations',
            endpoint: endpoint
        });

        let getMarketplaceParticipationsv2 = await sellingPartner.callAPI({
            operation: 'getMarketplaceParticipations',
            endpoint: endpoint,
            options: {
                raw_result: true
            }
        });

        res.json({
            payload: {
                getMarketplaceParticipations, // should return list of marketplaces the seller can sell in
                getMarketplaceParticipationsv2, // should return list of marketplaces the seller can sell in as raw result
            }
        })
    } catch (error) {
        res.json({
            error: error
        })
    }
}


module.exports = {
    endpoints,
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
}