const xlsx = require("xlsx");
const fs = require("fs");

const writeToExcel = (data) => {
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(
    Object.entries(data).map(([key, value]) => ({ Name: key, ...value }))
  );

  xlsx.utils.book_append_sheet(workbook, worksheet, "Amazon Inventory");

  xlsx.writeFile(workbook, "Amazon_Inventory.xlsx");
};

// Save extracted data
// writeToExcel(extractedData);



console.log("Excel file created successfully!");


module.exports = {
    writeToExcel
}