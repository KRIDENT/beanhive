// ─────────────────────────────────────────────
// ADMIN SERVICE — Business logic
// Dashboard stats, user management, order overview.
// ─────────────────────────────────────────────
const adminRepository = require('../repositories/adminRepository');

const VALID_ROLES = ['customer', 'admin'];

const adminService = {
  getStats() {
    const users = adminRepository.countUsers();
    const orders = adminRepository.countOrders();
    const revenue = adminRepository.sumRevenue();

    return {
      totalUsers: users.count,
      totalOrders: orders.count,
      totalRevenue: Math.round(revenue.total * 100) / 100
    };
  },

  getAllUsers() {
    const users = adminRepository.findAllUsers();
    return users.map(u => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      role: u.role || 'customer',
      createdAt: u.created_at
    }));
  },

  updateUserRole(targetUserId, newRole, requestingUserId) {
    if (!VALID_ROLES.includes(newRole)) {
      const err = new Error('Invalid role. Must be one of: ' + VALID_ROLES.join(', '));
      err.statusCode = 400;
      err.errorCode = 'BAD_REQUEST';
      throw err;
    }

    if (targetUserId === requestingUserId) {
      const err = new Error('You cannot change your own role.');
      err.statusCode = 400;
      err.errorCode = 'BAD_REQUEST';
      throw err;
    }

    const user = adminRepository.findUserById(targetUserId);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      err.errorCode = 'RESOURCE_NOT_FOUND';
      throw err;
    }

    adminRepository.updateRole(targetUserId, newRole);

    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: newRole
    };
  },

  getAllOrders(limit = 50) {
    const orders = adminRepository.findAllOrders(limit);
    return orders.map(o => ({
      id: o.id,
      customer: {
        id: o.user_id,
        firstName: o.first_name,
        lastName: o.last_name,
        email: o.email
      },
      items: JSON.parse(o.items),
      subtotal: o.subtotal,
      tax: o.tax,
      total: o.total,
      status: o.status,
      createdAt: o.created_at
    }));
  },

  // ── Analytics ────────────────────────────────

  getAnalytics(days = 30) {
    const revenueByDay = adminRepository.revenueByDay(days);
    const ordersByStatus = adminRepository.ordersByStatus();
    const rawItems = adminRepository.allOrderItems(days);
    const usersByDay = adminRepository.usersByDay(days);
    const revenueSummary = adminRepository.revenueSummary();

    // Aggregate top-selling items from order JSON
    const itemCounts = {};
    rawItems.forEach(row => {
      try {
        const items = JSON.parse(row.items);
        items.forEach(item => {
          const name = item.name || item.title || 'Unknown';
          if (!itemCounts[name]) itemCounts[name] = { name, quantity: 0, revenue: 0 };
          const qty = item.quantity || 1;
          const price = item.price || 0;
          itemCounts[name].quantity += qty;
          itemCounts[name].revenue += price * qty;
        });
      } catch (e) { /* skip unparseable */ }
    });

    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(i => ({
        name: i.name,
        quantity: i.quantity,
        revenue: Math.round(i.revenue * 100) / 100
      }));

    return {
      revenueByDay: revenueByDay.map(r => ({
        date: r.date,
        revenue: Math.round(r.revenue * 100) / 100,
        orders: r.orders
      })),
      ordersByStatus: ordersByStatus.map(s => ({
        status: s.status,
        count: s.count
      })),
      topItems,
      usersByDay: usersByDay.map(u => ({
        date: u.date,
        count: u.count
      })),
      revenueSummary: {
        today: Math.round(revenueSummary.today * 100) / 100,
        week: Math.round(revenueSummary.week * 100) / 100,
        month: Math.round(revenueSummary.month * 100) / 100,
        allTime: Math.round(revenueSummary.allTime * 100) / 100
      }
    };
  }
};

module.exports = adminService;
