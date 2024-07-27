import express from "express";
import dotenv from "dotenv";
import cors from "cors";
const router = require('./routes/router');

dotenv.config();

const app = express();
const port = process.env.PORT;
app.use(cors());

app.use('/api/v1', router);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});