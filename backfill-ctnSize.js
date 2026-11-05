// Backfill ctnSize (Package Size) for existing document items
// Run on server: node backfill-ctnSize.js
const Database = require('better-sqlite3');
const db = new Database('/var/www/toy-admin/data/app.db');

// Get all products with their specifications
const products = db.prepare('SELECT itemNumber, specifications FROM product').all();
const productMap = {};
for (const p of products) {
  try {
    const specs = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications;
    // Find Package Size
    let pkgSize = '';
    for (const [k, v] of Object.entries(specs || {})) {
      if (/package size/i.test(k)) { pkgSize = String(v); break; }
    }
    if (pkgSize) productMap[p.itemNumber] = pkgSize;
  } catch(e) {}
}
console.log(`Loaded ${Object.keys(productMap)} products with Package Size`);

// Get all documents
const docs = db.prepare('SELECT id, items FROM document').all();
let updated = 0;

for (const doc of docs) {
  let items;
  try { items = typeof doc.items === 'string' ? JSON.parse(doc.items) : doc.items; } catch(e) { continue; }
  if (!Array.isArray(items)) continue;

  let changed = false;
  for (const item of items) {
    if (item.ctnSize) continue; // already has value
    // Extract item number from description like "Product Name (LCPPT888629)"
    const m = (item.description || '').match(/\(([A-Z0-9]+)\)/);
    if (m && productMap[m[1]]) {
      item.ctnSize = productMap[m[1]];
      changed = true;
    }
  }

  if (changed) {
    db.prepare('UPDATE document SET items = ? WHERE id = ?').run(JSON.stringify(items), doc.id);
    updated++;
  }
}

console.log(`Updated ${updated} documents`);
db.close();
