require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// CORS — allow localhost + Vercel domain
app.use(cors({
  origin: [
    "http://localhost:3000",
    /\.vercel\.app$/       // allow all *.vercel.app subdomains
  ],
  credentials: true
}));

app.use(express.json());

// ROUTES
app.use("/api", require("./routes/classRoutes"));
app.use("/api", require("./routes/examRoutes"));
app.use("/api", require("./routes/questionRoutes"));
app.use("/api", require("./routes/teacherRoutes"));
app.use("/api", require("./routes/studentAuthRoutes"));
app.use("/api", require("./routes/resultRoutes"));   // ← fixed: was "/api/results" (doubled prefix)

const PORT = process.env.PORT || 5000;

// 🔥 CONNECT DB FIRST, THEN START SERVER
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo Error:", err);
  });