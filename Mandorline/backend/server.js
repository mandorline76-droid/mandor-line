const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// CORS yang lebih eksplisit
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logger
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Static files (frontend)
app.use(express.static(path.join(__dirname, '../app')));
app.use('/uploads', express.static(path.join(__dirname, '../app/uploads')));

// Routes
app.use('/api/login', require('./routes/auth'));
app.use('/api/temuan', require('./routes/temuan'));
app.use('/api/temuan', require('./routes/tindakLanjut'));

// Dashboard stats
app.get('/api/dashboard', async (req, res) => {
    try {
        const db = require('./db');
        const rows = await db.getTemuan(); // Returns joined data

        const total = rows.length;
        const open = rows.filter(r => r.status === 'Open').length;
        const prog = rows.filter(r => r.status === 'In Progress').length;
        const done = rows.filter(r => r.status === 'Closed').length;
        const noTl = rows.filter(r => !r.status).length;

        res.json({ success: true, total, open: open + noTl, in_progress: prog, closed: done });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal memuat statistik: ' + err.message });
    }
});

// Serve frontend index for unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../app/index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ MandorLine server berjalan di http://localhost:${PORT}`);
});
