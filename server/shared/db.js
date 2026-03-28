// ─────────────────────────────────────────────
// DATABASE — SQLite setup and schema
// Database-per-service pattern (single SQLite for demo)
// ─────────────────────────────────────────────
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'beanhive.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Create tables ────────────────────────────
// Following architecture: audit columns (created_at, updated_at),
// soft deletes (deleted_at), UUID-style IDs where practical
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name   TEXT NOT NULL,
    last_name    TEXT NOT NULL,
    email        TEXT NOT NULL UNIQUE COLLATE NOCASE,
    phone        TEXT DEFAULT '',
    password     TEXT NOT NULL,
    role         TEXT DEFAULT 'customer',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid        TEXT PRIMARY KEY,
    sess       TEXT NOT NULL,
    expired_at DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    items      TEXT NOT NULL,
    subtotal   REAL NOT NULL,
    tax        REAL NOT NULL,
    total      REAL NOT NULL,
    status     TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    drink_id   TEXT NOT NULL,
    drink_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, drink_id)
  );

  CREATE TABLE IF NOT EXISTS rewards (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL UNIQUE,
    stars      INTEGER DEFAULT 0,
    tier       TEXT DEFAULT 'green',
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS rewards_transactions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    order_id     INTEGER,
    stars_change INTEGER NOT NULL,
    type         TEXT NOT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    description TEXT DEFAULT '',
    price       REAL NOT NULL,
    calories    INTEGER DEFAULT 0,
    is_food     INTEGER DEFAULT 0,
    image       TEXT DEFAULT '',
    featured    INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    token      TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used       INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    token      TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used       INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ── Migrations ───────────────────────────────
const columns = db.prepare('PRAGMA table_info(users)').all();
if (!columns.some(c => c.name === 'role')) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer'");
}
if (!columns.some(c => c.name === 'google_id')) {
  db.exec('ALTER TABLE users ADD COLUMN google_id TEXT DEFAULT NULL');
}
if (!columns.some(c => c.name === 'email_verified')) {
  db.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0');
  // Mark existing users as verified so they aren't locked out
  db.exec('UPDATE users SET email_verified = 1');
}

// ── Seed admin account ───────────────────────
const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
if (!adminExists) {
  const hash = bcrypt.hashSync('beanhive-admin', 12);
  db.prepare(
    "INSERT OR IGNORE INTO users (first_name, last_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)"
  ).run('Admin', 'User', 'admin@beanhive.com', '', hash, 'admin');

  // Create rewards entry for admin
  const admin = db.prepare("SELECT id FROM users WHERE email = 'admin@beanhive.com'").get();
  if (admin) {
    const hasRewards = db.prepare('SELECT id FROM rewards WHERE user_id = ?').get(admin.id);
    if (!hasRewards) {
      db.prepare('INSERT INTO rewards (user_id, stars, tier) VALUES (?, 0, ?)').run(admin.id, 'green');
    }
  }
}

// ── Seed menu items ──────────────────────────
const menuCount = db.prepare('SELECT COUNT(*) as count FROM menu_items').get();
if (menuCount.count === 0) {
  const insert = db.prepare(
    'INSERT INTO menu_items (slug, name, category, description, price, calories, is_food, image, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const items = [
    // ── Drinks (featured items marked with 1) ──
    ['caramel-macchiato', 'Caramel Macchiato', 'Hot Coffees', 'Freshly steamed milk with vanilla-flavored syrup, marked with espresso and topped with a caramel drizzle for an oh-so-sweet finish.', 5.95, 250, 0, 'Images/Caramel Macchiato.png', 1],
    ['pumpkin-spice-latte', 'Pumpkin Spice Latte', 'Hot Coffees', 'Our signature espresso and steamed milk with the celebrated flavor combination of pumpkin, cinnamon, nutmeg and clove. Topped with whipped cream and real pumpkin-pie spices.', 6.45, 390, 0, 'Images/Pumpkin Spice Latte.png', 1],
    ['cold-brew', 'Cold Brew', 'Cold Coffees', 'Slow-steeped for a super-smooth flavor, our Cold Brew is handcrafted in small batches daily, and served cold right from the tap.', 4.75, 5, 0, 'Images/Cold Brew.png', 1],
    ['iced-matcha-latte', 'Iced Matcha Latte', 'Matcha', 'Smooth and creamy matcha is lightly sweetened and served with milk over ice. A refreshing pick-me-up with an energy boost from the green tea.', 5.75, 200, 0, 'Images/Iced Matcha Latte.png', 1],
    ['house-blend', 'House Blend', 'Hot Coffees', 'Our signature blend. Rich and inviting with notes of toffee and cocoa. A perfect everyday coffee.', 3.95, 5, 0, 'Images/close-up-coffee-cup-with-beans.png', 1],
    ['vanilla-latte', 'Vanilla Latte', 'Hot Coffees', 'Our smooth signature espresso with vanilla syrup, topped with steamed milk and a light layer of foam.', 5.65, 250, 0, 'Images/Caramel Macchiato.png', 0],
    ['chai-tea-latte', 'Chai Tea Latte', 'Hot Teas', 'Black tea infused with cinnamon, clove and other warming spices, combined with steamed milk and topped with foam.', 5.45, 240, 0, 'Images/Pumpkin Spice Latte.png', 0],
    ['iced-caramel-macchiato', 'Iced Caramel Macchiato', 'Cold Coffees', 'We combine our rich espresso with vanilla-flavored syrup, milk and ice, then top it off with a caramel drizzle.', 5.95, 250, 0, 'Images/Caramel Macchiato.png', 0],
    ['white-chocolate-mocha', 'White Chocolate Mocha', 'Hot Coffees', 'Our signature espresso meets white chocolate sauce and steamed milk, finished with sweetened whipped cream.', 6.25, 430, 0, 'Images/Pumpkin Spice Latte.png', 0],
    ['caff-latte', 'Caffè Latte', 'Hot Coffees', 'Rich, full-bodied espresso combined with steamed milk and a light layer of foam.', 5.25, 190, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['flat-white', 'Flat White', 'Hot Coffees', 'Smooth ristretto shots of espresso get the perfect amount of whole steamed milk for a balanced, creamy flavor.', 5.45, 170, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['cappuccino', 'Cappuccino', 'Hot Coffees', 'Dark, rich espresso lies in wait under a smoothed and stretched layer of thick foam.', 4.95, 140, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['caff-mocha', 'Caffè Mocha', 'Hot Coffees', 'Rich espresso combined with bittersweet mocha sauce and steamed milk, topped with sweetened whipped cream.', 5.45, 360, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['featured-dark-roast', 'Featured Dark Roast', 'Hot Coffees', 'A bold, full-bodied coffee with a rich and robust flavor profile. Freshly brewed daily.', 2.95, 5, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['featured-medium-roast', 'Featured Medium Roast', 'Hot Coffees', 'A smooth, balanced cup with bright acidity and a clean finish.', 2.95, 5, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['featured-blonde-roast', 'Featured Blonde Roast', 'Hot Coffees', 'A lighter, gentler blend with subtle sweet citrus notes and a mellow body.', 2.95, 5, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['vanilla-sweet-cream-cold-brew', 'Vanilla Sweet Cream Cold Brew', 'Cold Coffees', 'Our slow-steeped Cold Brew sweetened with vanilla syrup and topped with house-made vanilla sweet cream.', 5.65, 110, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['salted-caramel-cream-cold-brew', 'Salted Caramel Cream Cold Brew', 'Cold Coffees', 'Slow-steeped Cold Brew topped with a salted caramel cream cold foam.', 5.95, 230, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['chocolate-cream-cold-brew', 'Chocolate Cream Cold Brew', 'Cold Coffees', 'Our Cold Brew topped with a chocolate cream cold foam that cascades through the cup.', 5.75, 250, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['iced-caff-latte', 'Iced Caffè Latte', 'Cold Coffees', 'Our dark, rich espresso combined with milk and served over ice.', 5.25, 130, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['iced-americano', 'Iced Americano', 'Cold Coffees', 'Espresso shots topped with cold water produce a light layer of crema over ice.', 4.25, 15, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['iced-caff-mocha', 'Iced Caffè Mocha', 'Cold Coffees', 'Our rich espresso combined with bittersweet mocha sauce, milk and ice, topped with whipped cream.', 5.45, 350, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['matcha-tea-latte', 'Matcha Tea Latte', 'Matcha', 'Smooth and creamy matcha sweetened just right and served with steamed milk.', 5.45, 190, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['iced-lavender-cream-matcha', 'Iced Lavender Cream Matcha', 'Matcha', 'Vibrant matcha paired with lavender-flavored cream and oat milk over ice.', 6.25, 270, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['iced-banana-bread-matcha', 'Iced Banana Bread Matcha', 'Matcha', 'Smooth matcha meets brown butter and banana flavors for a comforting iced treat.', 6.25, 280, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['iced-double-berry-matcha', 'Iced Double Berry Matcha', 'Matcha', 'Matcha layered with a berry blend over ice for a fruity and earthy combination.', 6.25, 250, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['london-fog-latte', 'London Fog Latte', 'Hot Teas', 'Bright, citrusy Earl Grey tea with steamed milk and vanilla syrup.', 5.25, 180, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['mocha-frappuccino', 'Mocha Frappuccino', 'Frappuccinos', 'Mocha sauce, coffee and milk blended with ice, topped with whipped cream.', 5.95, 370, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['caramel-ribbon-crunch', 'Caramel Ribbon Crunch', 'Frappuccinos', 'Buttery caramel syrup blended with coffee, milk and ice, layered with dark caramel sauce and crunchy topping.', 6.45, 420, 0, 'Images/Caramel Macchiato.png', 0],
    ['java-chip-frappuccino', 'Java Chip Frappuccino', 'Frappuccinos', 'Chips of chocolate blended with coffee, milk and ice, topped with whipped cream and mocha drizzle.', 5.95, 440, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['strawberry-acai-lemonade', 'Strawberry Açaí Lemonade', 'Refreshers', 'Sweet strawberry and açaí flavors shaken with lemonade and ice.', 5.25, 140, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['mango-dragonfruit', 'Mango Dragonfruit', 'Refreshers', 'Tropical mango and dragonfruit flavors shaken with ice and real diced dragonfruit.', 4.95, 90, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['paradise-drink', 'Paradise Drink', 'Refreshers', 'Tropical pineapple and passionfruit flavors combined with creamy coconut milk and ice.', 5.25, 140, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['hot-chocolate', 'Hot Chocolate', 'Hot Chocolate', 'Steamed milk with vanilla and mocha sauces, topped with sweetened whipped cream.', 4.45, 370, 0, 'Images/close-up-coffee-cup-with-beans.png', 0],

    // ── Food Items ──
    ['bacon-gouda-egg-sandwich', 'Bacon, Gouda & Egg Sandwich', 'Breakfast', 'Applewood-smoked bacon, fluffy Parmesan cage-free egg frittata and melted aged Gouda on an artisan roll.', 5.45, 370, 1, 'Images/foods.jpg', 0],
    ['turkey-bacon-egg-white-sandwich', 'Turkey Bacon & Egg White Sandwich', 'Breakfast', 'Sliced turkey bacon with cage-free egg whites and reduced-fat white cheddar on an English muffin.', 4.95, 230, 1, 'Images/foods.jpg', 0],
    ['sausage-cheddar-egg-sandwich', 'Sausage, Cheddar & Egg Sandwich', 'Breakfast', 'A savory pork sausage patty, aged cheddar and a cage-free fried egg on a toasted English muffin.', 4.95, 480, 1, 'Images/foods.jpg', 0],
    ['everything-bagel', 'Everything Bagel', 'Breakfast', 'A classic everything bagel topped with sesame seeds, poppy seeds, garlic and onion.', 3.45, 290, 1, 'Images/foods.jpg', 0],
    ['butter-croissant', 'Butter Croissant', 'Bakery', 'A flaky, buttery croissant with delicate layers that melt in your mouth.', 3.75, 260, 1, 'Images/foods.jpg', 0],
    ['chocolate-croissant', 'Chocolate Croissant', 'Bakery', 'Two bars of rich chocolate wrapped in buttery, flaky croissant dough.', 3.95, 320, 1, 'Images/foods.jpg', 0],
    ['blueberry-muffin', 'Blueberry Muffin', 'Bakery', 'A moist muffin bursting with juicy blueberries and topped with a sweet streusel crumble.', 3.65, 340, 1, 'Images/foods.jpg', 0],
    ['banana-walnut-bread', 'Banana Walnut Bread', 'Bakery', 'Rich banana bread with walnuts, lovingly baked with a hint of cinnamon.', 3.95, 420, 1, 'Images/foods.jpg', 0],
    ['cake-pop', 'Birthday Cake Pop', 'Treats', 'Vanilla cake mixed with buttercream, dipped in a sweet pink chocolaty coating.', 3.50, 160, 1, 'Images/foods.jpg', 0],
    ['chocolate-brownie', 'Chocolate Brownie', 'Treats', 'Rich, fudgy and intensely chocolatey. The perfect indulgence for any chocolate lover.', 3.75, 400, 1, 'Images/foods.jpg', 0],
    ['chocolate-chip-cookie', 'Chocolate Chip Cookie', 'Treats', 'A classic cookie loaded with semi-sweet chocolate chips. Soft, chewy center.', 3.25, 360, 1, 'Images/foods.jpg', 0],
    ['jalapeno-chicken-pocket', 'Jalapeño Chicken Pocket', 'Lunch', 'Toasted chile lavash flatbread stuffed with diced chicken, charred poblanos and three-chile-pepper cheese.', 6.25, 410, 1, 'Images/foods.jpg', 0],
    ['chicken-caprese-sandwich', 'Chicken & Mozzarella Sandwich', 'Lunch', 'Sliced chicken breast with fresh mozzarella, roasted tomatoes and basil pesto on ciabatta bread.', 6.95, 520, 1, 'Images/foods.jpg', 0],
    ['turkey-pesto-sandwich', 'Turkey & Pesto Sandwich', 'Lunch', 'Slow-roasted turkey, herbed cream cheese, basil pesto and mixed greens on rustic sourdough bread.', 6.75, 480, 1, 'Images/foods.jpg', 0],
    ['protein-box', 'Cheese & Fruit Protein Box', 'Lite Bites', 'Sliced apples, cheddar cheese, roasted almonds, a hard-boiled egg and multigrain crackers.', 5.95, 470, 1, 'Images/foods.jpg', 0],
    ['peanut-butter-jelly-protein-box', 'PB&J Protein Box', 'Lite Bites', 'Creamy peanut butter with strawberry jam on multigrain bread, served with fresh fruit.', 5.95, 500, 1, 'Images/foods.jpg', 0],

    // ── At Home / Merchandise ──
    ['ethiopia-whole-bean', 'Ethiopia Whole Bean', 'Whole Bean', 'Single-origin Ethiopian coffee with bright citrus and floral notes. Medium roast.', 16.95, 0, 1, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['colombia-whole-bean', 'Colombia Whole Bean', 'Whole Bean', 'A balanced, nutty sweetness with a juicy mouthfeel from the Colombian Andes. Medium roast.', 14.95, 0, 1, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['sumatra-whole-bean', 'Sumatra Whole Bean', 'Whole Bean', 'Full-bodied and earthy with herbal notes and a lingering spice finish. Dark roast.', 15.95, 0, 1, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['beanhive-house-blend', 'Beanhive House Blend', 'Whole Bean', 'Our signature blend. Rich and inviting with notes of toffee and cocoa.', 13.95, 0, 1, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['beanhive-espresso-roast', 'Beanhive Espresso Roast', 'Whole Bean', 'Our flagship espresso. Smooth, rich with caramel sweetness and a deep finish.', 14.95, 0, 1, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['via-instant-italian-roast', 'VIA Instant Italian Roast', 'VIA Instant', 'A bold, intensely roasted instant coffee with a deep smoky flavor.', 8.95, 5, 1, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['via-instant-vanilla-latte', 'VIA Instant Vanilla Latte', 'VIA Instant', 'Creamy vanilla latte in an instant. Premium microground coffee with natural vanilla flavor.', 7.95, 130, 1, 'Images/close-up-coffee-cup-with-beans.png', 0],
    ['beanhive-ceramic-mug', 'Beanhive Ceramic Mug', 'Merchandise', 'A classic 12oz ceramic mug featuring the Beanhive logo. Dishwasher and microwave safe.', 14.95, 0, 1, 'Images/beanhive_logo-removebg-preview.png', 0],
    ['beanhive-tumbler-16oz', 'Beanhive Tumbler 16oz', 'Merchandise', 'Double-walled stainless steel tumbler. Keeps drinks hot for 5 hours or cold for 12.', 24.95, 0, 1, 'Images/beanhive_logo-removebg-preview.png', 0],
  ];

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(...row);
    }
  });
  insertMany(items);
}

module.exports = db;
