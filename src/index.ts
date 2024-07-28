import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
const router = require('./routes/router');

dotenv.config();

const app = express();

// Define the rate limit rule
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again after a minute.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const port = process.env.PORT;
app.use(cors());
app.use(limiter);
app.use('/api/v1', router);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});