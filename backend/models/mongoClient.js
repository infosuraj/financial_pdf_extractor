import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const uri = process.env.MONGO_URI;
mongoose.connect(uri);

const financialDataSchema = new mongoose.Schema({
  rawText: String,
  structuredData: {
    periods: Array,
    financialItems: Array,
    sectionTotals: Array,
    validationResults: Array
  },
  uploadTimestamp: { type: Date, default: Date.now },
  documentMetadata: Object
});

const FinancialData = mongoose.model('FinancialData', financialDataSchema);

export default FinancialData;