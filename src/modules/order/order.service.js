const prisma = require('../../config/prisma');
const { paginate, paginateMeta } = require('../../utils/paginate');

// Valid transitions: what statuses a vendor can move an order to
const ALLOWED_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

const createOrder = async (userId, body) => {
  const { produceId } = body;
  if (!produceId) throw { status: 400, message: 'produceId is required' };

  const produce = await prisma.produce.findUnique({ where: { id: produceId } });
  if (!produce) throw { status: 404, message: 'Produce not found' };

  if (produce.certificationStatus !== 'APPROVED') {
    throw { status: 400, message: 'This produce is not yet approved for sale' };
  }
  if (produce.availableQuantity < 1) {
    throw { status: 400, message: 'This produce is out of stock' };
  }

  // Prevent vendor from ordering their own produce
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (vendorProfile && produce.vendorId === vendorProfile.id) {
    throw { status: 400, message: 'You cannot order your own produce' };
  }

  const [order] = await prisma.$transaction([
    prisma.order.create({
      data: { userId, produceId, vendorId: produce.vendorId, status: 'PENDING' },
    }),
    prisma.produce.update({
      where: { id: produceId },
      data: { availableQuantity: { decrement: 1 } },
    }),
  ]);

  return order;
};

const getMyOrders = async (userId, query) => {
  const { page, limit, skip, take } = paginate(query.page, query.limit);

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      skip,
      take,
      include: { produce: { select: { name: true, price: true } } },
      orderBy: { orderDate: 'desc' },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return { items, meta: paginateMeta(total, page, limit) };
};

const updateOrderStatus = async (userId, orderId, body) => {
  const { status } = body;
  if (!status) throw { status: 400, message: 'Status is required' };

  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendorProfile) throw { status: 404, message: 'Vendor profile not found' };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw { status: 404, message: 'Order not found' };
  if (order.vendorId !== vendorProfile.id) {
    throw { status: 403, message: 'You can only update orders for your own produce' };
  }

  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed.includes(status)) {
    throw {
      status: 400,
      message: `Cannot change status from ${order.status} to ${status}. Allowed: ${allowed.length ? allowed.join(', ') : 'none (final state)'}`,
    };
  }

  // Restore stock when order is cancelled
  if (status === 'CANCELLED') {
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status } }),
      prisma.produce.update({
        where: { id: order.produceId },
        data: { availableQuantity: { increment: 1 } },
      }),
    ]);
    return prisma.order.findUnique({ where: { id: orderId } });
  }

  return prisma.order.update({ where: { id: orderId }, data: { status } });
};

const getVendorOrders = async (userId, query) => {
  const { page, limit, skip, take } = paginate(query.page, query.limit);
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendorProfile) throw { status: 404, message: 'Vendor profile not found' };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where: { vendorId: vendorProfile.id },
      skip,
      take,
      include: {
        produce: { select: { name: true, price: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { orderDate: 'desc' },
    }),
    prisma.order.count({ where: { vendorId: vendorProfile.id } }),
  ]);

  return { items, meta: paginateMeta(total, page, limit) };
};

module.exports = { createOrder, getMyOrders, updateOrderStatus, getVendorOrders };
