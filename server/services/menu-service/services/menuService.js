// ─────────────────────────────────────────────
// MENU SERVICE — Business logic
// ─────────────────────────────────────────────
const menuRepository = require('../repositories/menuRepository');

function formatItem(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    description: row.description,
    price: row.price,
    calories: row.calories,
    isFood: !!row.is_food,
    image: row.image,
    featured: !!row.featured,
    createdAt: row.created_at
  };
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const menuService = {
  getAll(category) {
    return menuRepository.findAll(category).map(formatItem);
  },

  getBySlug(slug) {
    const item = menuRepository.findBySlug(slug);
    if (!item) return null;
    return formatItem(item);
  },

  getFeatured() {
    return menuRepository.findFeatured().map(formatItem);
  },

  getCategories() {
    return menuRepository.getCategories().map(r => r.category);
  },

  create(data) {
    const slug = data.slug || generateSlug(data.name);

    // Check for duplicate slug
    const existing = menuRepository.findBySlug(slug);
    if (existing) {
      const err = new Error('An item with this name already exists.');
      err.statusCode = 409;
      err.errorCode = 'CONFLICT';
      throw err;
    }

    const id = menuRepository.create({
      slug,
      name: data.name,
      category: data.category,
      description: data.description || '',
      price: parseFloat(data.price),
      calories: parseInt(data.calories, 10) || 0,
      isFood: data.isFood || false,
      image: data.image || '',
      featured: data.featured || false
    });

    return formatItem(menuRepository.findById(id));
  },

  update(id, data) {
    const item = menuRepository.findById(id);
    if (!item) {
      const err = new Error('Menu item not found.');
      err.statusCode = 404;
      err.errorCode = 'RESOURCE_NOT_FOUND';
      throw err;
    }

    const fields = {};
    if (data.name !== undefined) {
      fields.name = data.name;
      fields.slug = generateSlug(data.name);
    }
    if (data.category !== undefined) fields.category = data.category;
    if (data.description !== undefined) fields.description = data.description;
    if (data.price !== undefined) fields.price = parseFloat(data.price);
    if (data.calories !== undefined) fields.calories = parseInt(data.calories, 10) || 0;
    if (data.isFood !== undefined) fields.is_food = data.isFood ? 1 : 0;
    if (data.featured !== undefined) fields.featured = data.featured ? 1 : 0;
    if (data.image !== undefined) fields.image = data.image;

    if (Object.keys(fields).length > 0) {
      menuRepository.update(id, fields);
    }

    return formatItem(menuRepository.findById(id));
  },

  updateImage(id, imagePath) {
    const item = menuRepository.findById(id);
    if (!item) {
      const err = new Error('Menu item not found.');
      err.statusCode = 404;
      err.errorCode = 'RESOURCE_NOT_FOUND';
      throw err;
    }
    menuRepository.updateImage(id, imagePath);
    return formatItem(menuRepository.findById(id));
  },

  delete(id) {
    const item = menuRepository.findById(id);
    if (!item) {
      const err = new Error('Menu item not found.');
      err.statusCode = 404;
      err.errorCode = 'RESOURCE_NOT_FOUND';
      throw err;
    }
    menuRepository.delete(id);
  }
};

module.exports = menuService;
