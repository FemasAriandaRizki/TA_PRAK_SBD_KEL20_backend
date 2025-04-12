const express = require("express");
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Get All Customer
router.get("/", authenticateToken, (req, res) => {
  db.query("SELECT * FROM customer", (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Error retrieving customers", error: err.message });
    res.json(results);
  });
});

// Add Customer
router.post("/", authenticateToken, (req, res) => {
  const { nama_cust, alamat_cust, telp_cust, no_ktp } = req.body;

  // Validasi input tidak boleh kosong
  if (!nama_cust || !alamat_cust || !telp_cust || !no_ktp) {
    return res.status(400).json({
      message: "Nama, alamat, telepon, dan nomor KTP tidak boleh kosong",
    });
  }

  const sql =
    "INSERT INTO customer (nama_cust, alamat_cust, telp_cust, no_ktp) VALUES (?, ?, ?, ?)";
  db.query(sql, [nama_cust, alamat_cust, telp_cust, no_ktp], (err) => {
    if (err) {
      // Tangani error jika telp_cust atau no_ktp sudah ada (duplicate entry)
      if (err.code === "ER_DUP_ENTRY") {
        if (err.sqlMessage.includes("telp_cust")) {
          return res
            .status(400)
            .json({ message: "Nomor telepon sudah digunakan" });
        }
        if (err.sqlMessage.includes("no_ktp")) {
          return res.status(400).json({ message: "Nomor KTP sudah digunakan" });
        }
      }
      return res
        .status(500)
        .json({ message: "Error adding customer", error: err.message });
    }
    res.status(201).json({ message: "Customer added successfully" });
  });
});

// Edit Customer
router.put("/:id_cust", authenticateToken, (req, res) => {
  const { nama_cust, alamat_cust, telp_cust, no_ktp } = req.body;
  const { id_cust } = req.params;

  // Validasi input tidak boleh kosong
  if (!nama_cust || !alamat_cust || !telp_cust || !no_ktp) {
    return res.status(400).json({
      message: "Nama, alamat, telepon, dan nomor KTP tidak boleh kosong",
    });
  }

  // Cek apakah telp_cust atau no_ktp sudah digunakan oleh customer lain
  const checkSql =
    "SELECT id_cust FROM customer WHERE (telp_cust = ? OR no_ktp = ?) AND id_cust != ?";
  db.query(checkSql, [telp_cust, no_ktp, id_cust], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Error checking duplicates", error: err.message });

    if (results.length > 0) {
      const duplicateField =
        results[0].telp_cust === telp_cust ? "Nomor telepon" : "Nomor KTP";
      return res.status(400).json({
        message: `${duplicateField} sudah digunakan oleh customer lain`,
      });
    }

    // Jika tidak ada duplikat, lanjutkan update
    const updateSql =
      "UPDATE customer SET nama_cust = ?, alamat_cust = ?, telp_cust = ?, no_ktp = ? WHERE id_cust = ?";
    db.query(
      updateSql,
      [nama_cust, alamat_cust, telp_cust, no_ktp, id_cust],
      (err, result) => {
        if (err) {
          // Tangani error jika telp_cust atau no_ktp sudah ada (duplicate entry)
          if (err.code === "ER_DUP_ENTRY") {
            if (err.sqlMessage.includes("telp_cust")) {
              return res
                .status(400)
                .json({ message: "Nomor telepon sudah digunakan" });
            }
            if (err.sqlMessage.includes("no_ktp")) {
              return res
                .status(400)
                .json({ message: "Nomor KTP sudah digunakan" });
            }
          }
          return res
            .status(500)
            .json({ message: "Error updating customer", error: err.message });
        }
        if (result.affectedRows === 0)
          return res.status(404).json({ message: "Customer not found" });
        res.json({ message: "Customer updated successfully" });
      }
    );
  });
});

// Delete Customer
router.delete("/:id_cust", authenticateToken, (req, res) => {
  const { id_cust } = req.params;
  const sql = "DELETE FROM customer WHERE id_cust = ?";

  db.query(sql, [id_cust], (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Error deleting customer", error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer deleted successfully" });
  });
});

module.exports = router;
