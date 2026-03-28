// ─────────────────────────────────────────────
// FAVORITES CONTROLLER — HTTP handlers
// ─────────────────────────────────────────────
const favoritesService = require('../services/favoritesService');
const { success, created, badRequest } = require('../../../shared/utils/response');

const favoritesController = {
  // GET /v1/favorites
  list(req, res, next) {
    try {
      const favorites = favoritesService.getUserFavorites(req.session.userId);
      return success(res, { favorites }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // POST /v1/favorites
  add(req, res, next) {
    try {
      const { drinkId, drinkName } = req.body;
      if (!drinkId || !drinkName) {
        return badRequest(res, 'Drink ID and name are required.', req);
      }

      const favorite = favoritesService.addFavorite(req.session.userId, drinkId, drinkName);
      return created(res, { message: 'Added to favorites!', favorite }, req);
    } catch (err) {
      return next(err);
    }
  },

  // DELETE /v1/favorites/:drinkId
  remove(req, res, next) {
    try {
      favoritesService.removeFavorite(req.session.userId, req.params.drinkId);
      return success(res, { message: 'Removed from favorites.' }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // GET /v1/favorites/check/:drinkId
  check(req, res, next) {
    try {
      const isFavorite = favoritesService.checkFavorite(req.session.userId, req.params.drinkId);
      return success(res, { isFavorite }, 200, req);
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = favoritesController;
