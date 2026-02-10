require("dotenv").config();
const express = require("express");
const routes = require("./routes");
const cors = require("cors");
const path = require("path");   // ✅ ADD THIS

const app = express();

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// API routes
app.use("/", routes);

// ✅ SERVE REACT BUILD
app.use(express.static(path.join(__dirname, "../dist")));

// ✅ SPA SUPPORT (important for /confirm/:token)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});


app.listen(3000, () => console.log("🚑 Server running on port 3000"));
