import { getDatabase, schema } from './db';
import { hashSync } from 'bcryptjs';
import { Logger } from '@nestjs/common';

const logger = new Logger('DB-Migrate');

export async function migrateAndSeed(): Promise<void> {
  const db = getDatabase();
  const { admin, category, product, blogPost, inquiry } = schema;

  logger.log('Running database migrations...');

  db.run(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      product_count INTEGER NOT NULL DEFAULT 0,
      hero_image_url TEXT,
      card_image_url TEXT,
      accent_color TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS product (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      item_number TEXT,
      category TEXT,
      description TEXT,
      features TEXT NOT NULL DEFAULT '[]',
      specifications TEXT NOT NULL DEFAULT '{}',
      moq INTEGER DEFAULT 0,
      customization_available INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      gallery TEXT NOT NULL DEFAULT '[]',
      packaging_info TEXT,
      lead_time TEXT,
      age_group TEXT,
      price_range TEXT,
      is_featured INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS blog_post (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT,
      category TEXT,
      author TEXT,
      author_avatar TEXT,
      date TEXT,
      reading_time TEXT,
      cover_image TEXT,
      content TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inquiry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      company TEXT,
      country TEXT,
      email TEXT,
      whatsapp TEXT,
      estimated_quantity TEXT,
      product_name TEXT,
      product_item_number TEXT,
      product_category TEXT,
      page_url TEXT,
      message TEXT,
      source TEXT DEFAULT 'rfq',
      status TEXT NOT NULL DEFAULT 'new',
      customization_requirement TEXT,
      selected_products TEXT NOT NULL DEFAULT '[]',
      product_interest TEXT,
      source_page TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS customer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_no TEXT NOT NULL UNIQUE,
      company TEXT NOT NULL,
      country TEXT,
      city TEXT,
      background TEXT,
      scale TEXT,
      employee_count TEXT,
      founded_year TEXT,
      source TEXT DEFAULT 'manual',
      contact_person TEXT,
      whatsapp TEXT,
      google_address TEXT,
      facebook TEXT,
      website TEXT,
      email TEXT,
      instagram TEXT,
      linkedin TEXT,
      contact_invalid TEXT NOT NULL DEFAULT '{}',
      customer_type TEXT,
      priority TEXT DEFAULT 'C',
      brand_used TEXT,
      business_detail TEXT,
      last_follow_up_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS customer_followup (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      follow_date INTEGER NOT NULL,
      content TEXT,
      feedback TEXT,
      is_replied INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS document (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'quotation',
      document_no TEXT NOT NULL UNIQUE,
      date TEXT,
      validity TEXT,
      seller_info TEXT,
      buyer_info TEXT,
      items TEXT,
      terms TEXT,
      bank_info TEXT,
      notes TEXT,
      total_amount TEXT,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'draft',
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )
  `);

  // Add bank_info column if table exists but column doesn't (for existing databases)
  try {
    const cols = db.all(`PRAGMA table_info(document)`) as { name: string }[];
    if (!cols.find((c) => c.name === 'bank_info')) {
      db.run('ALTER TABLE document ADD COLUMN bank_info TEXT');
      logger.log('Added bank_info column to document table');
    }
  } catch {
    /* table might not exist yet, ignore */
  }

  const adminRow = db.select().from(admin).limit(1).get();
  if (!adminRow) {
    logger.log('Seeding default admin user...');
    db.insert(admin)
      .values({
        username: 'admin',
        passwordHash: hashSync('admin123', 10),
      })
      .run();
    logger.log('Default admin created: admin / admin123');
  }

  const catRow = db.select().from(category).limit(1).get();
  if (!catRow) {
    logger.log('Seeding categories...');
    db.insert(category)
      .values([
        {
          name: 'Beach Toys',
          slug: 'beach-toys',
          description: 'Summer fun beach toys for kids of all ages',
          productCount: 12,
          accentColor: '#FF6B35',
        },
        {
          name: 'Building Blocks',
          slug: 'building-blocks',
          description: 'Creative building blocks and construction sets',
          productCount: 8,
          accentColor: '#1565FF',
        },
        {
          name: 'RC Toys',
          slug: 'rc-toys',
          description: 'Remote control cars, drones and more',
          productCount: 6,
          accentColor: '#9333EA',
        },
        {
          name: 'Educational Toys',
          slug: 'educational-toys',
          description: 'Learning toys that inspire curiosity',
          productCount: 10,
          accentColor: '#10B981',
        },
      ])
      .run();
  }

  const prodRow = db.select().from(product).limit(1).get();
  if (!prodRow) {
    logger.log('Seeding products...');
    db.insert(product)
      .values([
        {
          name: 'Summer Beach Bucket Set',
          slug: 'summer-beach-bucket-set',
          itemNumber: 'BT-2001',
          category: 'beach-toys',
          description:
            'Complete beach bucket set with 8 pieces including bucket, shovel, rake, sand molds and more. Made of durable non-toxic plastic.',
          features: [
            '8-piece set',
            'Non-toxic BPA-free plastic',
            'Bright colors',
            'Suitable for ages 3+',
          ],
          specifications: {
            Material: 'PP Plastic',
            'Package Size': '28x20x15 cm',
            Weight: '350g',
            MOQ: '500 pcs',
          },
          moq: 500,
          customizationAvailable: true,
          imageUrl: '',
          gallery: [],
          packagingInfo: 'Color box packaging',
          leadTime: '30-35 days',
          ageGroup: '3+ years',
          priceRange: '$1.50 - $2.50',
          isFeatured: true,
        },
        {
          name: 'Creative Building Blocks 500pcs',
          slug: 'creative-building-blocks-500pcs',
          itemNumber: 'BB-3001',
          category: 'building-blocks',
          description:
            '500 pieces creative building blocks set. Compatible with major brands. Includes wheels, windows, doors and special pieces.',
          features: [
            '500 pieces',
            'Compatible with major brands',
            'ABS material',
            'Storage bucket included',
          ],
          specifications: {
            Material: 'ABS Plastic',
            'Package Size': '35x25x20 cm',
            Weight: '1.2kg',
            MOQ: '300 pcs',
          },
          moq: 300,
          customizationAvailable: true,
          imageUrl: '',
          gallery: [],
          packagingInfo: 'Storage bucket with color label',
          leadTime: '25-30 days',
          ageGroup: '6+ years',
          priceRange: '$8.00 - $12.00',
          isFeatured: true,
        },
        {
          name: 'RC High Speed Car',
          slug: 'rc-high-speed-car',
          itemNumber: 'RC-4001',
          category: 'rc-toys',
          description:
            'High speed remote control car with 2.4GHz remote control. Rechargeable battery. Top speed 25km/h.',
          features: [
            '2.4GHz remote control',
            '25km/h top speed',
            'Rechargeable battery',
            'Shock absorption system',
          ],
          specifications: {
            'Control Distance': '50 meters',
            'Battery Life': '30 minutes',
            'Car Size': '28x15x8 cm',
            MOQ: '200 pcs',
          },
          moq: 200,
          customizationAvailable: true,
          imageUrl: '',
          gallery: [],
          packagingInfo: 'Display box',
          leadTime: '35-40 days',
          ageGroup: '8+ years',
          priceRange: '$15.00 - $22.00',
          isFeatured: true,
        },
      ])
      .run();
  }

  const blogRow = db.select().from(blogPost).limit(1).get();
  if (!blogRow) {
    logger.log('Seeding blog posts...');
    db.insert(blogPost)
      .values([
        {
          title: 'Top 10 Educational Toys for Kids in 2026',
          slug: 'top-10-educational-toys-2026',
          excerpt:
            'Discover the best educational toys that combine fun with learning, carefully selected by our toy experts.',
          category: 'Educational',
          author: 'Toy Experts Team',
          authorAvatar: '',
          date: '2026-08-15',
          readingTime: '5 min read',
          coverImage: '',
          content: [
            'Educational toys play a crucial role in child development. They help build cognitive skills, improve creativity, and make learning fun.',
            'In this article, we have curated the top 10 educational toys for 2026 that every parent should consider.',
          ],
        },
        {
          title: 'How to Choose the Right RC Car for Your Child',
          slug: 'choose-right-rc-car',
          excerpt:
            'A complete guide to selecting the perfect remote control car based on age, skill level, and interests.',
          category: 'RC Toys',
          author: 'Mike Johnson',
          authorAvatar: '',
          date: '2026-08-10',
          readingTime: '4 min read',
          coverImage: '',
          content: [
            'RC cars are a classic toy that never goes out of style. But with so many options available, choosing the right one can be overwhelming.',
            'Consider factors like age appropriateness, speed, battery life, and durability when making your selection.',
          ],
        },
      ])
      .run();
  }

  const inqRow = db.select().from(inquiry).limit(1).get();
  if (!inqRow) {
    logger.log('Seeding sample inquiries...');
    const now = Date.now();
    db.insert(inquiry)
      .values([
        {
          name: 'John Smith',
          company: 'ABC Toys Inc.',
          country: 'United States',
          email: 'john@abctoys.com',
          whatsapp: '+1 555 0123',
          estimatedQuantity: '5000 units',
          productName: 'Summer Beach Bucket Set',
          productItemNumber: 'BT-2001',
          productCategory: 'beach-toys',
          pageUrl: '/products/beach-toys/summer-beach-bucket-set',
          message:
            'Hello, I am interested in your beach bucket set. Could you please provide FOB pricing for 5000 units? Also, do you offer custom branding on the bucket? We would need our logo printed.',
          source: 'rfq',
          status: 'replied',
          selectedProducts: [],
          createdAt: new Date(now - 86400000 * 5),
          updatedAt: new Date(now - 86400000 * 3),
        },
        {
          name: 'Robert Wilson',
          company: 'PlayWorld Australia',
          country: 'Australia',
          email: 'robert@playworld.com.au',
          whatsapp: '+61 412 345 678',
          estimatedQuantity: '1000 units',
          productName: 'RC High Speed Car',
          productItemNumber: 'RC-4001',
          productCategory: 'rc-toys',
          pageUrl: '/products/rc-toys/rc-high-speed-car',
          message:
            "G'day, Interested in your RC high speed car. Can you provide specifications and C-tick certification for the Australian market? Also, we need samples for testing. Please advise on sample cost and delivery time to Sydney.",
          source: 'rfq',
          status: 'archived',
          selectedProducts: [],
          createdAt: new Date(now - 86400000 * 10),
          updatedAt: new Date(now - 86400000 * 8),
        },
      ])
      .run();
  }

  logger.log('Database migrations completed successfully.');
}
