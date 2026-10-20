#!/usr/bin/env node
/**
 * 清理 public/uploads 下未被数据库引用的图片
 * 用法：
 *   node cleanup-uploads.js           # dry-run，只列出孤儿文件
 *   node cleanup-uploads.js --delete   # 真正删除
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const ROOT = __dirname;
const UPLOADS_DIR = path.join(ROOT, 'server', 'public', 'uploads');
const DB_FILE = path.join(ROOT, 'data', 'app.db');
const DO_DELETE = process.argv.includes('--delete');

if (!fs.existsSync(UPLOADS_DIR)) {
  console.error('找不到 uploads 目录:', UPLOADS_DIR);
  process.exit(1);
}
if (!fs.existsSync(DB_FILE)) {
  console.error('找不到数据库:', DB_FILE);
  process.exit(1);
}

const db = new Database(DB_FILE, { readonly: true });

// 收集数据库里所有引用过的图片文件名
const referenced = new Set();
function collectUrls(rows, fields) {
  for (const row of rows) {
    for (const f of fields) {
      const v = row[f];
      if (!v) continue;
      const arr = Array.isArray(v) ? v : [v];
      for (const u of arr) {
        if (typeof u !== 'string' || !u) continue;
        // 只关注 uploads 路径下的
        const m = u.match(/\/uploads\/([^?#]+)/);
        if (m) referenced.add(decodeURIComponent(m[1]));
      }
    }
  }
}

collectUrls(db.prepare('SELECT image_url, gallery FROM product').all(), ['image_url', 'gallery']);
collectUrls(db.prepare('SELECT hero_image_url, card_image_url FROM category').all(), ['hero_image_url', 'card_image_url']);
collectUrls(db.prepare('SELECT cover_image FROM blog_post').all(), ['cover_image']);
try {
  collectUrls(db.prepare('SELECT attachments FROM inquiry').all(), ['attachments']);
} catch (_) {}

console.log(`数据库引用了 ${referenced.size} 个 uploads 文件`);

// 遍历磁盘上所有文件
const onDisk = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else onDisk.push(path.relative(UPLOADS_DIR, p).replace(/\\/g, '/'));
  }
})(UPLOADS_DIR);

console.log(`uploads 目录共 ${onDisk.length} 个文件\n`);

const orphans = onDisk.filter((f) => !referenced.has(f));
console.log(`=== 未被引用的图片 ${orphans.length} 个 ===`);
for (const f of orphans) console.log('  ' + f);

if (!DO_DELETE) {
  console.log(`\n[dry-run] 未删除任何文件。确认无误后运行: node cleanup-uploads.js --delete`);
  process.exit(0);
}

let freed = 0, count = 0;
for (const f of orphans) {
  const p = path.join(UPLOADS_DIR, f);
  const sz = fs.statSync(p).size;
  fs.unlinkSync(p);
  freed += sz; count++;
}
console.log(`\n已删除 ${count} 个文件，释放 ${(freed / 1024 / 1024).toFixed(2)} MB`);
