const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/login
router.post('/', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
        }
        const result = await db.login(username, password);
        if (!result.success) {
            return res.status(401).json({ success: false, message: result.message || 'Username atau password salah' });
        }
        res.json({ success: true, user: result.user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal login: ' + err.message });
    }
});

module.exports = router;
