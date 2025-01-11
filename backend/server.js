const express = require('express');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const upload = multer({ storage: multer.memoryStorage() });
const uploadRouter = require('./routes/upload');
const fetchDataRoute = require('./routes/fetchData');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use('/upload', upload.single('file'), uploadRouter);
app.use('/fetch-data', fetchDataRoute);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});