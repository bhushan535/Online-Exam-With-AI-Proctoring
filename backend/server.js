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

app.use(express.json({ limit: "50mb" }));

// ROUTES
app.use("/api", require("./routes/classRoutes"));
app.use("/api", require("./routes/examRoutes"));
app.use("/api", require("./routes/questionRoutes"));
app.use("/api", require("./routes/teacherRoutes"));
app.use("/api", require("./routes/studentAuthRoutes"));
app.use("/api", require("./routes/resultRoutes"));   // ← fixed: was "/api/results" (doubled prefix)
app.use("/api/violations", require("./routes/proctorRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/principal", require("./routes/principalRoutes"));

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