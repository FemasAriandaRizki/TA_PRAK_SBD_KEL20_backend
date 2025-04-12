const express = require("express");
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Get All Rental
router.get("/", authenticateToken, (req, res) => {
  db.query("SELECT * FROM rental", (err, results) => {
    if (err)
      return res.status(500).json({ message: "Error retrieving rentals" });
    res.json(results);
  });
});

// Get Rental Details with JOIN
router.get("/details", authenticateToken, (req, res) => {
  const sql = `
    SELECT 
      r.id_rental,
      CONCAT(m.merk, ' ', m.model) AS nama_mobil,
      m.gambar,
      p.tanggal_bayar,
      p.total_biaya,
      p.metode_bayar,
      r.tanggal_sewa,
      r.tanggal_kembali,
      r.status_transaksi,
      c.nama_cust,
      k.nama_karyawan
    FROM rental r
    JOIN mobil m ON r.id_mobil = m.id_mobil
    JOIN pembayaran p ON r.id_pembayaran = p.id_pembayaran
    LEFT JOIN customer c ON r.id_cust = c.id_cust
    LEFT JOIN karyawan k ON r.id_karyawan = k.id_karyawan;
  `;
  db.query(sql, (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Error retrieving rental details" });
    res.json(results);
  });
});

// Add Rental
router.post("/", authenticateToken, (req, res) => {
  const {
    id_cust,
    id_mobil,
    id_karyawan,
    id_pembayaran,
    tanggal_sewa,
    tanggal_kembali,
    status_transaksi,
  } = req.body;
  const sql =
    "INSERT INTO rental (id_cust, id_mobil, id_karyawan, id_pembayaran, tanggal_sewa, tanggal_kembali, status_transaksi) VALUES (?, ?, ?, ?, ?, ?, ?)";

  db.query(
    sql,
    [
      id_cust,
      id_mobil,
      id_karyawan,
      id_pembayaran,
      tanggal_sewa,
      tanggal_kembali,
      status_transaksi,
    ],
    (err) => {
      if (err) return res.status(500).json({ message: "Error adding rental" });
      res.status(201).json({ message: "Rental added successfully" });
    }
  );
});

// Edit Rental
router.put("/:id_rental", authenticateToken, (req, res) => {
  const {
    id_cust,
    id_mobil,
    id_karyawan,
    id_pembayaran,
    tanggal_sewa,
    tanggal_kembali,
    status_transaksi,
  } = req.body;
  const { id_rental } = req.params;
  const sql =
    "UPDATE rental SET id_cust = ?, id_mobil = ?, id_karyawan = ?, id_pembayaran = ?, tanggal_sewa = ?, tanggal_kembali = ?, status_transaksi = ? WHERE id_rental = ?";

  db.query(
    sql,
    [
      id_cust,
      id_mobil,
      id_karyawan,
      id_pembayaran,
      tanggal_sewa,
      tanggal_kembali,
      status_transaksi,
      id_rental,
    ],
    (err, result) => {
      if (err)
        return res.status(500).json({ message: "Error updating rental" });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Rental not found" });
      res.json({ message: "Rental updated successfully" });
    }
  );
});

// Delete Rental
router.delete("/:id_rental", authenticateToken, (req, res) => {
  const { id_rental } = req.params;
  const sql = "DELETE FROM rental WHERE id_rental = ?";

  db.query(sql, [id_rental], (err, result) => {
    if (err) return res.status(500).json({ message: "Error deleting rental" });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Rental not found" });
    res.json({ message: "Rental deleted successfully" });
  });
});

module.exports = router;
