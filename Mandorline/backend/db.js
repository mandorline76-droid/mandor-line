require('dotenv').config();

const GAS_URL = process.env.GAS_WEB_APP_URL;

const db = {
  // Helper to convert multer file to base64 string
  fileToBase64(file) {
    if (!file || !file.buffer) return null;
    const base64 = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64}`;
  },

  async queryGAS(action, params = {}, method = 'GET', payload = null) {
    let url = new URL(GAS_URL);
    url.searchParams.append('action', action);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const options = {
      method: method,
      redirect: 'follow'
    };

    if (method === 'POST') {
      options.body = JSON.stringify({ action, payload: payload || {}, ...params });
      options.headers = { 'Content-Type': 'application/json' };
    }

    try {
      const res = await fetch(url.toString(), options);
      const text = await res.text();

      if (!res.ok) {
        console.error('GAS Error Response:', text);
        throw new Error('GAS Fetch Error: ' + res.status);
      }

      try {
        return JSON.parse(text);
      } catch (jsonErr) {
        console.error('GAS Invalid JSON:', text);
        throw new Error('GAS returned invalid JSON (HTML error page?)');
      }
    } catch (error) {
      console.error('GAS Error:', error);
      throw error;
    }
  },

  // Bridge methods
  async getTemuan() {
    const res = await this.queryGAS('get_data');
    return res.data;
  },

  async getTemuanById(id) {
    const res = await this.queryGAS('get_data');
    const temuan = res.raw_temuan.find(t => t.id == id);
    if (!temuan) return null;
    const tl = res.raw_tl.filter(item => item.temuan_id == id).sort((a, b) => b.id - a.id)[0];
    return { ...temuan, tindak_lanjut: tl || null };
  },

  async addTemuan(data) {
    return await this.queryGAS('add_temuan', {}, 'POST', data);
  },

  async upsertTL(data) {
    return await this.queryGAS('upsert_tl', {}, 'POST', data);
  },

  async getNextNoKondisi() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const tanggalKey = `${dd}${mm}${yy}`;

    const res = await this.queryGAS('get_counter', { tanggal: tanggalKey });
    const next = (res.counter || 0) + 1;
    const nnn = String(next).padStart(3, '0');
    return `HAR-${tanggalKey}-${nnn}`;
  },

  async incrementNoKondisi() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const tanggalKey = `${dd}${mm}${yy}`;
    return await this.queryGAS('increment_counter', { tanggal: tanggalKey }, 'POST');
  },

  async login(username, password) {
    return await this.queryGAS('login', { username, password });
  }
};

module.exports = db;
