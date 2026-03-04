const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage config - use Memory for Full Cloud
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Helper: generate No Kondisi HAR-DDMMYY-NNN
// Note: This is now handled by the UI/Backend calling db.getNextNoKondisi()
// But we'll keep a version here if needed for POST

// GET /api/temuan
router.get('/', async (req, res) => {
    try {
        const rows = await db.getTemuan();
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal mengambil data: ' + err.message });
    }
});

// GET /api/temuan/:id
router.get('/:id', async (req, res) => {
    try {
        const temuan = await db.getTemuanById(req.params.id);
        if (!temuan) return res.status(404).json({ success: false, message: 'Temuan tidak ditemukan' });
        res.json({ success: true, data: temuan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal mengambil detail: ' + err.message });
    }
});

// POST /api/temuan
router.post('/', upload.fields([{ name: 'foto_temuan_1' }, { name: 'foto_temuan_2' }]), async (req, res) => {
    try {
        const {
            nama_petugas, tanggal_patroli, penyulang, kondisi_cuaca,
            segmen, titik_koordinat, jenis_temuan, lokasi_temuan, keterangan
        } = req.body;

        if (!nama_petugas || !penyulang || !jenis_temuan || !lokasi_temuan) {
            return res.status(400).json({ success: false, message: 'Field wajib belum lengkap' });
        }

        const no_kondisi = await db.getNextNoKondisi();
        const now = tanggal_patroli || new Date().toISOString();

        const result = await db.addTemuan({
            no_kondisi, nama_petugas, tanggal_patroli: now, penyulang, kondisi_cuaca,
            segmen, titik_koordinat, jenis_temuan, lokasi_temuan,
            foto_temuan_1_base64: db.fileToBase64(req.files?.foto_temuan_1?.[0]),
            foto_temuan_2_base64: db.fileToBase64(req.files?.foto_temuan_2?.[0]),
            keterangan
        });

        if (result.success) {
            await db.incrementNoKondisi();
            res.json({ success: true, id: result.id, no_kondisi });
        } else {
            throw new Error(result.message || 'Gagal menyimpan ke Sheet');
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menyimpan temuan: ' + err.message });
    }
});

// GET /api/temuan/next-no-kondisi
router.get('/meta/next-no-kondisi', async (req, res) => {
    try {
        const no_kondisi = await db.getNextNoKondisi();
        res.json({ success: true, no_kondisi });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal mengambil No Kondisi: ' + err.message });
    }
});

module.exports = router;
