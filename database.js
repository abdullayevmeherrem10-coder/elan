const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db;

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      avatar TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_az TEXT NOT NULL,
      name_ru TEXT NOT NULL,
      icon TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_az TEXT NOT NULL,
      name_ru TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      city_id INTEGER NOT NULL,
      title_az TEXT NOT NULL,
      title_ru TEXT,
      description_az TEXT NOT NULL,
      description_ru TEXT,
      price REAL DEFAULT 0,
      currency TEXT DEFAULT 'AZN',
      images TEXT DEFAULT '[]',
      phone TEXT,
      status TEXT DEFAULT 'active',
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (city_id) REFERENCES cities(id)
    )
  `);

  // Seed categories
  const catCount = db.exec("SELECT COUNT(*) as c FROM categories");
  if (catCount[0].values[0][0] === 0) {
    const categories = [
      ['Daşınmaz əmlak', 'Недвижимость', 'home', 'dasinmaz-emlak'],
      ['Nəqliyyat', 'Транспорт', 'car', 'neqliyyat'],
      ['Elektronika', 'Электроника', 'smartphone', 'elektronika'],
      ['Ev və bağ', 'Дом и сад', 'sofa', 'ev-ve-bag'],
      ['Geyim və aksessuarlar', 'Одежда и аксессуары', 'shirt', 'geyim'],
      ['İş elanları', 'Вакансии', 'briefcase', 'is-elanlari'],
      ['Xidmətlər', 'Услуги', 'tools', 'xidmetler'],
      ['Heyvanlar', 'Животные', 'paw', 'heyvanlar'],
      ['Uşaq aləmi', 'Детский мир', 'baby', 'usaq-alemi'],
      ['Hobbi və idman', 'Хобби и спорт', 'football', 'hobbi-idman']
    ];
    const stmt = db.prepare("INSERT INTO categories (name_az, name_ru, icon, slug) VALUES (?, ?, ?, ?)");
    categories.forEach(c => {
      stmt.run(c);
    });
    stmt.free();
  }

  // Seed cities
  const cityCount = db.exec("SELECT COUNT(*) as c FROM cities");
  if (cityCount[0].values[0][0] === 0) {
    const cities = [
      ['Bakı', 'Баку'],
      ['Gəncə', 'Гянджа'],
      ['Sumqayıt', 'Сумгаит'],
      ['Mingəçevir', 'Мингячевир'],
      ['Şirvan', 'Ширван'],
      ['Lənkəran', 'Ленкорань'],
      ['Şəki', 'Шеки'],
      ['Yevlax', 'Евлах'],
      ['Xaçmaz', 'Хачмаз'],
      ['Quba', 'Куба'],
      ['Zaqatala', 'Закатала'],
      ['Naxçıvan', 'Нахчыван'],
      ['Qusar', 'Гусар'],
      ['İsmayıllı', 'Исмаиллы'],
      ['Qəbələ', 'Габала']
    ];
    const stmt = db.prepare("INSERT INTO cities (name_az, name_ru) VALUES (?, ?)");
    cities.forEach(c => {
      stmt.run(c);
    });
    stmt.free();
  }

  // Create demo users and ads
  const userCount = db.exec("SELECT COUNT(*) as c FROM users");
  if (userCount[0].values[0][0] === 0) {
    const hash = bcrypt.hashSync('demo123', 10);
    db.run("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)",
      ['Demo İstifadəçi', 'demo@elan.az', '+994501234567', hash]);
    db.run("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)",
      ['Əli Məmmədov', 'ali@elan.az', '+994552223344', hash]);
    db.run("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)",
      ['Nigar Həsənova', 'nigar@elan.az', '+994703334455', hash]);

    // [user_id, cat_id, city_id, title_az, title_ru, desc_az, desc_ru, price, images_json]
    const demoAds = [
      [1, 1, 1, '3 otaqlı mənzil, Nəsimi r.', 'Квартира 3 комнаты, Насиминский р.',
        'Nəsimi rayonunda 3 otaqlı mənzil satılır. 90 kv.m, 7/16 mərtəbə. Tam təmirli, mebelli.',
        'Продаётся 3-х комнатная квартира в Насиминском районе. 90 кв.м, 7/16 этаж.', 185000,
        '["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop"]'],
      [2, 2, 1, 'Mercedes-Benz C200, 2020', 'Mercedes-Benz C200, 2020',
        'Mercedes-Benz C200 d, 2020-ci il. 45.000 km yürüş. Tam paket, qəzasız.',
        'Mercedes-Benz C200 d, 2020 год. Пробег 45.000 км.', 52000,
        '["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&h=400&fit=crop","https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&h=400&fit=crop"]'],
      [1, 3, 1, 'iPhone 15 Pro Max 256GB', 'iPhone 15 Pro Max 256GB',
        'iPhone 15 Pro Max, 256GB, Natural Titanium. Yeni qapalı qutuda, zəmanətli.',
        'iPhone 15 Pro Max, 256GB. Новый, запечатанный, с гарантией.', 2800,
        '["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=400&fit=crop","https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&h=400&fit=crop"]'],
      [3, 4, 2, 'Divan dəsti (künc divan)', 'Угловой диван',
        'Yeni künc divan dəsti satılır. Rəngi: boz. Ölçüsü: 3m x 2m. Çatdırılma var.',
        'Продаётся новый угловой диван. Цвет: серый. Доставка.', 950,
        '["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop","https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&h=400&fit=crop"]'],
      [2, 5, 1, 'Nike Air Max 270, ölçü 42', 'Nike Air Max 270, размер 42',
        'Orijinal Nike Air Max 270, 42 ölçü. Yeni, qutusu ilə.',
        'Оригинальные Nike Air Max 270, размер 42. Новые.', 180,
        '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop","https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=400&fit=crop"]'],
      [3, 6, 1, 'Proqramçı (Frontend Developer)', 'Программист (Frontend Developer)',
        'IT şirkətimizə Frontend Developer axtarılır. React, TypeScript bilmək tələb olunur. Əmək haqqı: 2000-3500 AZN.',
        'Ищем Frontend Developer. Требуется React, TypeScript.', 3000,
        '["https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop"]'],
      [1, 7, 1, 'Ev təmiri və dizayn xidməti', 'Ремонт квартир и дизайн',
        'Peşəkar komanda ilə ev təmiri. Dizayn layihəsi pulsuz. 5 il zəmanət. Əlaqə: +994501234567',
        'Профессиональный ремонт квартир. Дизайн-проект бесплатно.', 0,
        '["https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=600&h=400&fit=crop","https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=400&fit=crop"]'],
      [2, 1, 3, '2 otaqlı mənzil icarəyə verilir', 'Сдаётся 2-х комнатная квартира',
        'Sumqayıtda 2 otaqlı mənzil icarəyə verilir. Tam təmirli, mebelli. Aylıq 400 AZN.',
        '2-х комнатная квартира в аренду в Сумгаите.', 400,
        '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop","https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&h=400&fit=crop"]'],
      [3, 3, 1, 'MacBook Pro M3 14"', 'MacBook Pro M3 14"',
        'Apple MacBook Pro 14" M3 çip, 16GB RAM, 512GB SSD. Az istifadə edilib. Zəmanətdədir.',
        'MacBook Pro 14" M3, 16GB RAM, 512GB SSD.', 3900,
        '["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop","https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&h=400&fit=crop"]'],
      [1, 8, 1, 'Alman çoban iti balaları', 'Щенки немецкой овчарки',
        'Alman çoban iti balaları satılır. 2 aylıq, peyvəndli, pasportlu.',
        'Продаются щенки немецкой овчарки. 2 месяца.', 500,
        '["https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600&h=400&fit=crop","https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop"]'],
      [2, 3, 1, 'Samsung Galaxy S25 satılır. Barter var', 'Samsung Galaxy S25 продаётся. Обмен возможен',
        'Samsung Galaxy S25, 256GB, Iceblue rəng. 1 ay istifadə olunub, əla vəziyyətdədir. Qutusu, sənədləri var. Barter iPhone 15 ilə mümkündür. Qiymət: 1500 AZN.',
        'Samsung Galaxy S25, 256GB, цвет Iceblue. 1 месяц использования, отличное состояние. Коробка, документы. Обмен на iPhone 15 возможен.', 1500,
        '["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=400&fit=crop","https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600&h=400&fit=crop"]'],
      [3, 10, 2, 'Velosiped (dağ), 26"', 'Горный велосипед 26"',
        'Dağ velosipedi 26", 21 sürət, alüminium çərçivə. Az istifadə edilib.',
        'Горный велосипед 26", 21 скорость.', 350,
        '["https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=600&h=400&fit=crop","https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&h=400&fit=crop"]'],
    ];

    const adStmt = db.prepare(`INSERT INTO ads (user_id, category_id, city_id, title_az, title_ru, description_az, description_ru, price, images, phone, views)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '+994501234567', ?)`);
    demoAds.forEach((a) => {
      adStmt.run([a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], Math.floor(Math.random() * 200) + 10]);
    });
    adStmt.free();
  }

  saveDatabase();
  return db;
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function getDb() {
  return db;
}

module.exports = { initDatabase, getDb, saveDatabase };
