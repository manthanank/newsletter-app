const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { processScheduledNewsletters, trackNewsletterOpen, trackLinkClick } = require('./utils/newsletter');

require("dotenv").config();

// Connect to database
connectDB();

// Enable trust proxy to work with Vercel's proxy servers
app.set('trust proxy', 1);

app.use(
  cors({
    origin: "*",
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet()); // Security headers
app.use(morgan("dev")); // Request logging
app.use(limiter); // Rate limiting
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Routes
app.use("/api", require("./routes/subscribers"));
app.use("/api/templates", require("./routes/templates"));
app.use("/api/scheduled-newsletters", require("./routes/scheduledNewsletters"));

// Analytics tracking routes
app.get("/api/track-open", async (req, res) => {
  const { id, email } = req.query;
  if (id && email) {
    await trackNewsletterOpen(id, email);
  }
  
  // Return a transparent 1x1 pixel GIF
  const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.setHeader('Content-Type', 'image/gif');
  res.send(transparentGif);
});

app.get("/api/track-click", async (req, res) => {
  const { id, email, url } = req.query;
  
  if (id && email && url) {
    await trackLinkClick(id, email, url);
  }
  
  // Redirect to the original URL
  res.redirect(url || '/');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Set up scheduler to check for due newsletters every minute
setInterval(processScheduledNewsletters, 60 * 1000);
console.log('Newsletter scheduler started');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Export the Express API for Vercel serverless deployment
module.exports = app;
