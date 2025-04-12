require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const mobilRoutes = require("./routes/mobil");
const customerRoutes = require("./routes/customer");
const pembayaranRoutes = require("./routes/pembayaran");
const rentalRoutes = require("./routes/rental");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/mobil", mobilRoutes);
app.use("/customer", customerRoutes);
app.use("/pembayaran", pembayaranRoutes);
app.use("/rental", rentalRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
