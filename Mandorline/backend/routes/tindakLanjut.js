const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage config - use Memory for Full Cloud
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/temuan/:id/tindak-lanjut
router.post('/:id/tindak-lanjut', upload.fields([{ name: 'foto_tl_1' }, { name: 'foto_tl_2' }]), async (req, res) => {
    try {
        const temuan_id = parseInt(req.params.id);
        const { prioritas, nama_petugas_tl, status, tanggal_tl } = req.body;

        if (!prioritas || !nama_petugas_tl || !status || !tanggal_tl) {
            return res.status(400).json({ success: false, message: 'Field wajib belum lengkap' });
        }

        const foto1 = req.files?.foto_tl_1?.[0]?.filename || null;
        const foto2 = req.files?.foto_tl_2?.[0]?.filename || null;

        const result = await db.upsertTL({
            temuan_id: temuan_id,
            prioritas: prioritas,
            tanggal_tl: tanggal_tl,
            foto_tl_1_base64: db.fileToBase64(req.files?.foto_tl_1?.[0]),
            foto_tl_2_base64: db.fileToBase64(req.files?.foto_tl_2?.[0]),
            nama_petugas_tl: nama_petugas_tl,
            status: status
        });

        if (result.success) {
            res.json({ success: true, message: 'Tindak lanjut berhasil disimpan' });
        } else {
            throw new Error(result.message || 'Gagal menyimpan ke Sheet');
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menyimpan tindak lanjut: ' + err.message });
    }
});

module.exports = router;
