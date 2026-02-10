const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { initDatabase, getDb, saveDatabase } = require('./database');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = 3000;

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'elan-sayti-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== AUTH API ====================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Bütün sahələri doldurun' });
    }

    const db = getDb();
    const existing = db.exec("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(400).json({ error: 'Bu email artıq qeydiyyatdan keçib' });
    }

    const hash = bcrypt.hashSync(password, 10);
    db.run("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)",
      [name, email, phone || '', hash]);
    saveDatabase();

    const newUser = db.exec("SELECT id, name, email, phone FROM users WHERE email = ?", [email]);
    const user = newUser[0].values[0];
    req.session.userId = user[0];

    res.json({ id: user[0], name: user[1], email: user[2], phone: user[3] });
  } catch (err) {
    res.status(500).json({ error: 'Server xətası' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email və şifrəni daxil edin' });
    }

    const db = getDb();
    const result = db.exec("SELECT id, name, email, phone, password FROM users WHERE email = ?", [email]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(400).json({ error: 'Email və ya şifrə yanlışdır' });
    }

    const user = result[0].values[0];
    if (!bcrypt.compareSync(password, user[4])) {
      return res.status(400).json({ error: 'Email və ya şifrə yanlışdır' });
    }

    req.session.userId = user[0];
    res.json({ id: user[0], name: user[1], email: user[2], phone: user[3] });
  } catch (err) {
    res.status(500).json({ error: 'Server xətası' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Çıxış edildi' });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Giriş edilməyib' });
  }
  const db = getDb();
  const result = db.exec("SELECT id, name, email, phone, avatar FROM users WHERE id = ?", [req.session.userId]);
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
  }
  const u = result[0].values[0];
  res.json({ id: u[0], name: u[1], email: u[2], phone: u[3], avatar: u[4] });
});

// ==================== CATEGORIES API ====================

app.get('/api/categories', (req, res) => {
  const db = getDb();
  const result = db.exec("SELECT id, name_az, name_ru, icon, slug FROM categories ORDER BY id");
  if (result.length === 0) return res.json([]);
  const categories = result[0].values.map(r => ({
    id: r[0], name_az: r[1], name_ru: r[2], icon: r[3], slug: r[4]
  }));
  res.json(categories);
});

// ==================== CITIES API ====================

app.get('/api/cities', (req, res) => {
  const db = getDb();
  const result = db.exec("SELECT id, name_az, name_ru FROM cities ORDER BY name_az");
  if (result.length === 0) return res.json([]);
  const cities = result[0].values.map(r => ({
    id: r[0], name_az: r[1], name_ru: r[2]
  }));
  res.json(cities);
});

// ==================== ADS API ====================

app.get('/api/ads', (req, res) => {
  const db = getDb();
  const { category, city, search, min_price, max_price, sort, page = 1, limit = 20, user_id } = req.query;

  let where = ["a.status = 'active'"];
  let params = [];

  if (category) {
    where.push("c.slug = ?");
    params.push(category);
  }
  if (city) {
    where.push("a.city_id = ?");
    params.push(parseInt(city));
  }
  if (search) {
    where.push("(a.title_az LIKE ? OR a.title_ru LIKE ? OR a.description_az LIKE ?)");
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (min_price) {
    where.push("a.price >= ?");
    params.push(parseFloat(min_price));
  }
  if (max_price) {
    where.push("a.price <= ?");
    params.push(parseFloat(max_price));
  }
  if (user_id) {
    where.push("a.user_id = ?");
    params.push(parseInt(user_id));
  }

  let orderBy = "a.created_at DESC";
  if (sort === 'price_asc') orderBy = "a.price ASC";
  else if (sort === 'price_desc') orderBy = "a.price DESC";
  else if (sort === 'oldest') orderBy = "a.created_at ASC";

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const countSql = `SELECT COUNT(*) FROM ads a LEFT JOIN categories c ON a.category_id = c.id WHERE ${where.join(' AND ')}`;
  const countResult = db.exec(countSql, params);
  const total = countResult.length > 0 ? countResult[0].values[0][0] : 0;

  const sql = `
    SELECT a.id, a.title_az, a.title_ru, a.description_az, a.description_ru,
           a.price, a.currency, a.images, a.views, a.created_at,
           a.city_id, a.category_id, a.user_id,
           c.name_az as cat_name_az, c.name_ru as cat_name_ru, c.slug as cat_slug,
           ci.name_az as city_name_az, ci.name_ru as city_name_ru,
           u.name as user_name, u.phone as user_phone
    FROM ads a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN cities ci ON a.city_id = ci.id
    LEFT JOIN users u ON a.user_id = u.id
    WHERE ${where.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  params.push(parseInt(limit), offset);

  const result = db.exec(sql, params);
  if (result.length === 0) {
    return res.json({ ads: [], total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  }

  const cols = result[0].columns;
  const ads = result[0].values.map(row => {
    const obj = {};
    cols.forEach((col, i) => obj[col] = row[i]);
    obj.images = JSON.parse(obj.images || '[]');
    return obj;
  });

  res.json({
    ads,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit))
  });
});

app.get('/api/ads/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);

  // Increment views
  db.run("UPDATE ads SET views = views + 1 WHERE id = ?", [id]);
  saveDatabase();

  const sql = `
    SELECT a.*, c.name_az as cat_name_az, c.name_ru as cat_name_ru, c.slug as cat_slug,
           ci.name_az as city_name_az, ci.name_ru as city_name_ru,
           u.name as user_name, u.phone as user_phone, u.email as user_email, u.created_at as user_joined
    FROM ads a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN cities ci ON a.city_id = ci.id
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.id = ?
  `;
  const result = db.exec(sql, [id]);
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Elan tapılmadı' });
  }

  const cols = result[0].columns;
  const ad = {};
  cols.forEach((col, i) => ad[col] = result[0].values[0][i]);
  ad.images = JSON.parse(ad.images || '[]');

  res.json(ad);
});

app.post('/api/ads', requireAuth, upload.array('images', 8), (req, res) => {
  try {
    const db = getDb();
    const { title_az, title_ru, description_az, description_ru, price, currency, category_id, city_id, phone } = req.body;

    if (!title_az || !description_az || !category_id || !city_id) {
      return res.status(400).json({ error: 'Bütün sahələri doldurun' });
    }

    const images = req.files ? req.files.map(f => '/uploads/' + f.filename) : [];

    db.run(`INSERT INTO ads (user_id, category_id, city_id, title_az, title_ru, description_az, description_ru, price, currency, images, phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.session.userId, parseInt(category_id), parseInt(city_id),
       title_az, title_ru || '', description_az, description_ru || '',
       parseFloat(price) || 0, currency || 'AZN', JSON.stringify(images), phone || '']);
    saveDatabase();

    const newAd = db.exec("SELECT last_insert_rowid()");
    const adId = newAd[0].values[0][0];

    res.json({ id: adId, message: 'Elan əlavə edildi' });
  } catch (err) {
    res.status(500).json({ error: 'Server xətası' });
  }
});

app.put('/api/ads/:id', requireAuth, upload.array('images', 8), (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);

    const existing = db.exec("SELECT user_id, images FROM ads WHERE id = ?", [id]);
    if (existing.length === 0 || existing[0].values.length === 0) {
      return res.status(404).json({ error: 'Elan tapılmadı' });
    }
    if (existing[0].values[0][0] !== req.session.userId) {
      return res.status(403).json({ error: 'İcazə yoxdur' });
    }

    const { title_az, title_ru, description_az, description_ru, price, currency, category_id, city_id, phone, existing_images } = req.body;

    let images = existing_images ? JSON.parse(existing_images) : JSON.parse(existing[0].values[0][1] || '[]');
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => '/uploads/' + f.filename);
      images = images.concat(newImages);
    }

    db.run(`UPDATE ads SET title_az=?, title_ru=?, description_az=?, description_ru=?, price=?, currency=?,
            category_id=?, city_id=?, phone=?, images=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [title_az, title_ru || '', description_az, description_ru || '',
       parseFloat(price) || 0, currency || 'AZN',
       parseInt(category_id), parseInt(city_id), phone || '', JSON.stringify(images), id]);
    saveDatabase();

    res.json({ message: 'Elan yeniləndi' });
  } catch (err) {
    res.status(500).json({ error: 'Server xətası' });
  }
});

app.delete('/api/ads/:id', requireAuth, (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);

  const existing = db.exec("SELECT user_id FROM ads WHERE id = ?", [id]);
  if (existing.length === 0 || existing[0].values.length === 0) {
    return res.status(404).json({ error: 'Elan tapılmadı' });
  }
  if (existing[0].values[0][0] !== req.session.userId) {
    return res.status(403).json({ error: 'İcazə yoxdur' });
  }

  db.run("DELETE FROM ads WHERE id = ?", [id]);
  saveDatabase();
  res.json({ message: 'Elan silindi' });
});

// ==================== USER API ====================

app.put('/api/users/profile', requireAuth, upload.single('avatar'), (req, res) => {
  try {
    const db = getDb();
    const { name, phone } = req.body;
    let avatar = null;
    if (req.file) {
      avatar = '/uploads/' + req.file.filename;
    }

    if (avatar) {
      db.run("UPDATE users SET name=?, phone=?, avatar=? WHERE id=?",
        [name, phone || '', avatar, req.session.userId]);
    } else {
      db.run("UPDATE users SET name=?, phone=? WHERE id=?",
        [name, phone || '', req.session.userId]);
    }
    saveDatabase();

    const result = db.exec("SELECT id, name, email, phone, avatar FROM users WHERE id = ?", [req.session.userId]);
    const u = result[0].values[0];
    res.json({ id: u[0], name: u[1], email: u[2], phone: u[3], avatar: u[4] });
  } catch (err) {
    res.status(500).json({ error: 'Server xətası' });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server işləyir: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Database xətası:', err);
});
