const express = require("express");
const { PDFDocument } = require("pdf-lib");
const extractTables = require("../utils/ExtractTables");
const textract = require("../models/TextractClient");
const FinancialData = require("../models/mongoClient").default;

const router = express.Router();

router.post("/", async (req, res) => {
  const fileBuffer = req.file.buffer;

  try {
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pageCount = pdfDoc.getPageCount();

    if (pageCount === 1) {
      const blocks = await textract.analyzePdf(fileBuffer);
      const tablesData = extractTables(blocks);
      if (!tablesData || tablesData.length === 0) {
        return res.status(500).json({ message: "Invalid table structure." });
      }
      const rows = tablesData[0].rows;

      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(500).json({ message: "Invalid row structure." });
      }

      const header = rows[0];

      let organizedData = [];
      let currentSection = null;
      let sectionData = [];
      let sectionTotals = [];
      let validationResults = [];

      rows.slice(1).forEach((row) => {
        const sectionTitleContainsTotal = /total/i.test(row[0]);

        if (sectionTitleContainsTotal) {
          const sectionTotal = sectionData.reduce((acc, item) => {
            item.values.forEach((value, idx) => {
              if (!acc[idx]) acc[idx] = 0;
              acc[idx] += parseFloat(value);
            });
            return acc.map((value) => parseFloat(value.toFixed(2)));
          }, []);

          organizedData.push({
            section_title: currentSection,
            data: sectionData,
          });
          
          const totalValueInTitle = row
            .slice(1)
            .map((val) => (val === "-" ? 0 : parseFloat(val)));
          const validationArray = totalValueInTitle.map(
            (val, idx) => Math.abs(val - sectionTotal[idx]) < Number.EPSILON
          );

          sectionTotals.push({
            section_title: currentSection,
            total: sectionTotal,
            isValid: validationArray,
          });

          validationResults.push({
            section_title: currentSection,
            isValid: validationArray,
          });

          sectionData.push({
            period: "Original Total",
            sectionName: row[0],
            values: totalValueInTitle,
          });

          currentSection = null;
          sectionData = [];
        } else {
          if (!currentSection) {
            currentSection = row[0];
          }
          sectionData.push({
            period: header[sectionData.length + 1], // Link the data to the corresponding period
            sectionName: row[0],
            values: row
              .slice(1)
              .map((val) => (val === "-" ? 0 : parseFloat(val))),
          });
        }
      });

      if (currentSection) {
        const sectionTotal = sectionData.reduce((acc, item) => {
          item.values.forEach((value, idx) => {
            if (!acc[idx]) acc[idx] = 0;
            acc[idx] += parseFloat(value);
          });
          return acc.map((value) => parseFloat(value.toFixed(2)));
        }, []);

        organizedData.push({
          section_title: currentSection,
          data: sectionData,
        });
        sectionTotals.push({
          section_title: currentSection,
          total: sectionTotal,
          isValid: sectionData.every(
            (item) => item.values.length === header.slice(1).length
          ),
        });
        validationResults.push({
          section_title: currentSection,
          isValid: sectionData.every(
            (item) => item.values.length === header.slice(1).length
          ),
        });
      }

      const financialDocument = {
        rawText: JSON.stringify(rows),
        structuredData: {
          periods: header.slice(1),
          financialItems: organizedData,
          sectionTotals: sectionTotals,
          validationResults: validationResults,
        },
        documentMetadata: { fileName: req.file.originalname },
      };

      await FinancialData.findOneAndUpdate({}, financialDocument, {
        new: true,
        upsert: true,
        useFindAndModify: false,
      });

      return res
        .status(200)
        .json({
          message: "Click Show Button To Display Your Data.",
          tables: tablesData,
        });
    } else {
      return res.status(400).json({ message: "Single Page Pdf Only!" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Please Submit A Valid Pdf File!",
        error: error.message,
      });
  }
});

module.exports = router;
