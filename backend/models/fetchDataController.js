const FinancialData = require('../models/mongoClient').default;

const getFinancialData = async (req, res) => {
  try {
    const data = await FinancialData.find({}, "structuredData");
    const result = data.map((item) => item.structuredData);
    
    const periods = result.map((item) => item.periods);
    const financialItems = result.map((item) => item.financialItems);
    const sectionTotals = result.map((item) => item.sectionTotals);
    const validationResults =  result.map((item) => item.validationResults);

    res.json({
      periods,
      financialItems,
      sectionTotals,
      validationResults
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getFinancialData };