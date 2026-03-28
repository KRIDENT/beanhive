// ─────────────────────────────────────────────
// FAVORITES SERVICE — Business logic
// Part of User Service preferences (section 3.1).
// Separated into its own bounded context for
// clean code organization.
// ─────────────────────────────────────────────
const favoritesRepository = require('../repositories/favoritesRepository');

const favoritesService = {
  getUserFavorites(userId) {
    const favorites = favoritesRepository.findByUserId(userId);
    return favorites.map((f) => ({
      id: f.id,
      drinkId: f.drink_id,
      drinkName: f.drink_name,
      image: f.image || '',
      createdAt: f.created_at
    }));
  },

  addFavorite(userId, drinkId, drinkName) {
    const existing = favoritesRepository.findByUserAndDrink(userId, drinkId);
    if (existing) {
      const err = new Error('Already in your favorites.');
      err.statusCode = 409;
      err.errorCode = 'CONFLICT';
      err.favoriteId = existing.id;
      throw err;
    }

    const id = favoritesRepository.create(userId, drinkId, drinkName);
    return { id, drinkId, drinkName };
  },

  removeFavorite(userId, drinkId) {
    const changes = favoritesRepository.delete(userId, drinkId);
    if (changes === 0) {
      const err = new Error('Favorite not found.');
      err.statusCode = 404;
      err.errorCode = 'RESOURCE_NOT_FOUND';
      throw err;
    }
  },

  checkFavorite(userId, drinkId) {
    const existing = favoritesRepository.findByUserAndDrink(userId, drinkId);
    return !!existing;
  }
};

module.exports = favoritesService;
