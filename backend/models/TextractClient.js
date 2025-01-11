const { TextractClient, AnalyzeDocumentCommand } = require('@aws-sdk/client-textract');

const textractClient = new TextractClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const analyzePdf = async (fileBuffer) => {
  const params = {
    Document: { Bytes: fileBuffer },
    FeatureTypes: ['TABLES'],
  };
  const command = new AnalyzeDocumentCommand(params);
  const data = await textractClient.send(command);
  return data.Blocks;
};

module.exports = { analyzePdf };