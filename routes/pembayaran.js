const express = require("express");
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Get All Pembayaran
router.get("/", authenticateToken, (req, res) => {
  db.query("SELECT * FROM pembayaran", (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Error retrieving pembayaran", error: err.message });
    res.json(results);
  });
});

// Add Pembayaran
router.post("/", authenticateToken, (req, res) => {
  const { tanggal_bayar, total_biaya, metode_bayar } = req.body;

  // Validasi input tidak boleh kosong
  if (!tanggal_bayar || !total_biaya || !metode_bayar) {
    return res
      .status(400)
      .json({
        message:
          "Tanggal bayar, total biaya, dan metode bayar tidak boleh kosong",
      });
  }

  const sql =
    "INSERT INTO pembayaran (tanggal_bayar, total_biaya, metode_bayar) VALUES (?, ?, ?)";
  db.query(sql, [tanggal_bayar, total_biaya, metode_bayar], (err) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Error adding pembayaran", error: err.message });
    res.status(201).json({ message: "Pembayaran added successfully" });
  });
});

// Edit Pembayaran
router.put("/:id_pembayaran", authenticateToken, (req, res) => {
  const { tanggal_bayar, total_biaya, metode_bayar } = req.body;
  const { id_pembayaran } = req.params;

  // Validasi input tidak boleh kosong
  if (!tanggal_bayar || !total_biaya || !metode_bayar) {
    return res
      .status(400)
      .json({
        message:
          "Tanggal bayar, total biaya, dan metode bayar tidak boleh kosong",
      });
  }

  const sql =
    "UPDATE pembayaran SET tanggal_bayar = ?, total_biaya = ?, metode_bayar = ? WHERE id_pembayaran = ?";
  db.query(
    sql,
    [tanggal_bayar, total_biaya, metode_bayar, id_pembayaran],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error updating pembayaran", error: err.message });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Pembayaran not found" });
      res.json({ message: "Pembayaran updated successfully" });
    }
  );
});

// Delete Pembayaran
router.delete("/:id_pembayaran", authenticateToken, (req, res) => {
  const { id_pembayaran } = req.params;
  const sql = "DELETE FROM pembayaran WHERE id_pembayaran = ?";

  db.query(sql, [id_pembayaran], (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Error deleting pembayaran", error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Pembayaran not found" });
    res.json({ message: "Pembayaran deleted successfully" });
  });
});

module.exports = router;
