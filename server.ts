const dotenv = require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const etsyRoute = require("./routes/etsyRoute");
const amzRoute = require("./routes/amzRoute"); 
const metroRoute = require("./routes/metroRoute"); 
const fnskuRoute = require("./routes/fnskuRoute");
const errorHandler = require("./middleWare/errorMiddleware");
const cookieParser = require("cookie-parser");
const hbs = require("hbs");
const path = require("path");

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())
app.set("view engine", "hbs");
app.set("views", `${process.cwd()}/views`);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes Middleware
app.use("/api/etsy", etsyRoute);
app.use("/api/amz", amzRoute);
app.use("/api/metro", metroRoute); 
app.use("/api/fnsku", fnskuRoute); 


// Error Middleware
app.use(errorHandler);


// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`);
});
