const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

// Register Karyawan
router.post("/register", (req, res) => {
  const { nama_karyawan, username, password } = req.body;

  // Validasi input tidak boleh kosong
  if (!nama_karyawan || !username || !password) {
    return res
      .status(400)
      .json({ message: "Nama, username, dan password tidak boleh kosong" });
  }

  // Hash password
  bcrypt.hash(String(password), 10, (err, hash) => {
    if (err) return res.status(500).json({ message: "Error hashing password" });

    const sql =
      "INSERT INTO karyawan (nama_karyawan, username, password) VALUES (?, ?, ?)";
    db.query(sql, [nama_karyawan, username, hash], (err) => {
      if (err) {
        // Tangani error jika username sudah ada (duplicate entry)
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "Username sudah digunakan" });
        }
        return res
          .status(500)
          .json({ message: "Registration failed", error: err.message });
      }
      res.status(201).json({ message: "Karyawan registered successfully" });
    });
  });
});

// Login Karyawan
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Validasi input tidak boleh kosong
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username dan password tidak boleh kosong" });
  }

  const sql = "SELECT * FROM karyawan WHERE username = ?";
  db.query(sql, [username], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Login failed", error: err.message });
    if (results.length === 0)
      return res.status(401).json({ message: "Karyawan not found" });

    const karyawan = results[0];
    bcrypt.compare(password, karyawan.password, (err, isMatch) => {
      if (err || !isMatch)
        return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        { id_karyawan: karyawan.id_karyawan, username: karyawan.username },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.json({ message: "Login successful", token });
    });
  });
});

// Get All Karyawan (butuh autentikasi)
const authenticateToken = require("../middleware/authMiddleware");
router.get("/karyawan", authenticateToken, (req, res) => {
  db.query(
    "SELECT id_karyawan, nama_karyawan, username FROM karyawan",
    (err, results) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error retrieving karyawan", error: err.message });
      res.json(results);
    }
  );
});

// Edit Karyawan
router.put("/karyawan/:id_karyawan", authenticateToken, (req, res) => {
  const { nama_karyawan, username, password } = req.body;
  const { id_karyawan } = req.params;
  let sql =
    "UPDATE karyawan SET nama_karyawan = ?, username = ? WHERE id_karyawan = ?";
  let values = [nama_karyawan, username, id_karyawan];

  if (password) {
    bcrypt.hash(String(password), 10, (err, hash) => {
      if (err)
        return res.status(500).json({ message: "Error hashing password" });
      sql =
        "UPDATE karyawan SET nama_karyawan = ?, username = ?, password = ? WHERE id_karyawan = ?";
      values = [nama_karyawan, username, hash, id_karyawan];
      db.query(sql, values, (err, result) => {
        if (err)
          return res.status(500).json({ message: "Error updating karyawan" });
        if (result.affectedRows === 0)
          return res.status(404).json({ message: "Karyawan not found" });
        res.json({ message: "Karyawan updated successfully" });
      });
    });
  } else {
    db.query(sql, values, (err, result) => {
      if (err)
        return res.status(500).json({ message: "Error updating karyawan" });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Karyawan not found" });
      res.json({ message: "Karyawan updated successfully" });
    });
  }
});

// Delete Karyawan
router.delete("/karyawan/:id_karyawan", authenticateToken, (req, res) => {
  const { id_karyawan } = req.params;
  const sql = "DELETE FROM karyawan WHERE id_karyawan = ?";
  db.query(sql, [id_karyawan], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Error deleting karyawan" });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Karyawan not found" });
    res.json({ message: "Karyawan deleted successfully" });
  });
});

module.exports = router;
