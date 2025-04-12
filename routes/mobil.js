const express = require("express");
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Middleware to log requests for debugging
router.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Get All Mobil (hanya yang belum di-soft delete)
router.get("/", authenticateToken, (req, res) => {
  const sql = "SELECT * FROM mobil WHERE deleted_at IS NULL";
  db.query(sql, (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error retrieving mobil", error: err.message });
    }
    res.json(results);
  });
});

// Get All Mobil yang sudah di-soft delete (untuk halaman sampah)
router.get("/trash", authenticateToken, (req, res) => {
  const sql = "SELECT * FROM mobil WHERE deleted_at IS NOT NULL";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Error retrieving trashed mobil",
        error: err.message,
      });
    }
    res.json(results);
  });
});

// Add Mobil
router.post("/", authenticateToken, (req, res) => {
  const { merk, model, tahun, gambar, harga_sewa_per_hari } = req.body;

  // Validasi input tidak boleh kosong
  if (!merk || !model || !tahun || !gambar || !harga_sewa_per_hari) {
    return res.status(400).json({
      message:
        "Merk, model, tahun, gambar, dan harga sewa per hari tidak boleh kosong",
    });
  }

  // Validasi tambahan
  if (
    typeof tahun !== "number" ||
    tahun <= 0 ||
    tahun > new Date().getFullYear()
  ) {
    return res.status(400).json({
      message: `Tahun harus antara 1 dan ${new Date().getFullYear()}`,
    });
  }
  if (typeof harga_sewa_per_hari !== "number" || harga_sewa_per_hari <= 0) {
    return res.status(400).json({
      message: "Harga sewa per hari harus lebih dari 0",
    });
  }
  if (!gambar.startsWith("http")) {
    return res.status(400).json({
      message: "Link gambar harus valid (dimulai dengan http)",
    });
  }

  const sql =
    "INSERT INTO mobil (merk, model, tahun, gambar, harga_sewa_per_hari) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [merk, model, tahun, gambar, harga_sewa_per_hari], (err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error adding mobil", error: err.message });
    }
    res.status(201).json({ message: "Mobil added successfully" });
  });
});

// Edit Mobil
router.put("/:id_mobil", authenticateToken, (req, res) => {
  const { merk, model, tahun, gambar, harga_sewa_per_hari } = req.body;
  const { id_mobil } = req.params;

  // Validasi input tidak boleh kosong
  if (!merk || !model || !tahun || !gambar || !harga_sewa_per_hari) {
    return res.status(400).json({
      message:
        "Merk, model, tahun, gambar, dan harga sewa per hari tidak boleh kosong",
    });
  }

  // Validasi tambahan
  if (
    typeof tahun !== "number" ||
    tahun <= 0 ||
    tahun > new Date().getFullYear()
  ) {
    return res.status(400).json({
      message: `Tahun harus antara 1 dan ${new Date().getFullYear()}`,
    });
  }
  if (typeof harga_sewa_per_hari !== "number" || harga_sewa_per_hari <= 0) {
    return res.status(400).json({
      message: "Harga sewa per hari harus lebih dari 0",
    });
  }
  if (!gambar.startsWith("http")) {
    return res.status(400).json({
      message: "Link gambar harus valid (dimulai dengan http)",
    });
  }

  const sql =
    "UPDATE mobil SET merk = ?, model = ?, tahun = ?, gambar = ?, harga_sewa_per_hari = ? WHERE id_mobil = ? AND deleted_at IS NULL";
  db.query(
    sql,
    [merk, model, tahun, gambar, harga_sewa_per_hari, id_mobil],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error updating mobil", error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: `Mobil with id ${id_mobil} not found or already deleted`,
        });
      }
      res.json({ message: "Mobil updated successfully" });
    }
  );
});

// Soft Delete Mobil
router.delete("/soft/:id_mobil", authenticateToken, (req, res) => {
  const { id_mobil } = req.params;
  const sql =
    "UPDATE mobil SET deleted_at = NOW() WHERE id_mobil = ? AND deleted_at IS NULL";

  db.query(sql, [id_mobil], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error soft deleting mobil", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Mobil not found or already deleted" });
    }
    res.json({ message: "Mobil soft deleted successfully" });
  });
});

// Hard Delete Mobil (hanya dari sampah)
router.delete("/hard/:id_mobil", authenticateToken, (req, res) => {
  const { id_mobil } = req.params;
  const sql = "DELETE FROM mobil WHERE id_mobil = ? AND deleted_at IS NOT NULL";

  db.query(sql, [id_mobil], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error hard deleting mobil", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Mobil not found in trash" });
    }
    res.json({ message: "Mobil permanently deleted" });
  });
});

// Restore Mobil (mengembalikan data yang di-soft delete)
router.put("/restore/:id_mobil", authenticateToken, (req, res) => {
  const { id_mobil } = req.params;
  const sql =
    "UPDATE mobil SET deleted_at = NULL WHERE id_mobil = ? AND deleted_at IS NOT NULL";

  db.query(sql, [id_mobil], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error restoring mobil", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Mobil not found in trash" });
    }
    res.json({ message: "Mobil restored successfully" });
  });
});

// Catch-all for undefined routes
router.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

module.exports = router;
