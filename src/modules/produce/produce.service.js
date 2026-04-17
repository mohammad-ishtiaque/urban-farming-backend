const prisma = require('../../config/prisma');
const { paginate, paginateMeta } = require('../../utils/paginate');

// Public: get all approved produce (with optional category filter)
const getAllProduce = async (query) => {
  const { page, limit, skip, take } = paginate(query.page, query.limit);
  const where = { certificationStatus: 'APPROVED' };

  if (query.category) where.category = query.category;
  if (query.search) {
    where.name = { contains: query.search, mode: 'insensitive' };
  }

  const [items, total] = await Promise.all([
    prisma.produce.findMany({
      where,
      skip,
      take,
      include: {
        vendor: { select: { farmName: true, farmLocation: true } },
      },
      orderBy: { id: 'desc' },
    }),
    prisma.produce.count({ where }),
  ]);

  return { items, meta: paginateMeta(total, page, limit) };
};

// Public: get single produce by id
const getProduceById = async (id) => {
  const produce = await prisma.produce.findUnique({
    where: { id },
    include: {
      vendor: { select: { farmName: true, farmLocation: true } },
    },
  });
  if (!produce) throw { status: 404, message: 'Produce not found' };
  return produce;
};

// Vendor: create produce
const createProduce = async (userId, body) => {
  const { name, description, price, category, availableQuantity } = body;

  if (!name || !description || !price || !category || availableQuantity === undefined) {
    throw { status: 400, message: 'All fields are required: name, description, price, category, availableQuantity' };
  }

  const parsedPrice = parseFloat(price);
  const parsedQty = parseInt(availableQuantity);

  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    throw { status: 400, message: 'Price must be a positive number' };
  }
  if (isNaN(parsedQty) || parsedQty < 1) {
    throw { status: 400, message: 'Available quantity must be at least 1' };
  }

  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendorProfile) {
    throw { status: 404, message: 'Vendor profile not found. Please set up your farm profile first.' };
  }

  return prisma.produce.create({
    data: {
      vendorId: vendorProfile.id,
      name,
      description,
      price: parsedPrice,
      category,
      availableQuantity: parsedQty,
      certificationStatus: 'PENDING',
    },
  });
};

// Vendor: update their own produce
const updateProduce = async (userId, produceId, body) => {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendorProfile) throw { status: 404, message: 'Vendor profile not found' };

  const produce = await prisma.produce.findUnique({ where: { id: produceId } });
  if (!produce) throw { status: 404, message: 'Produce not found' };

  if (produce.vendorId !== vendorProfile.id) {
    throw { status: 403, message: 'You can only update your own produce' };
  }

  if (body.price !== undefined) {
    const p = parseFloat(body.price);
    if (isNaN(p) || p <= 0) throw { status: 400, message: 'Price must be a positive number' };
  }
  if (body.availableQuantity !== undefined) {
    const q = parseInt(body.availableQuantity);
    if (isNaN(q) || q < 0) throw { status: 400, message: 'Available quantity cannot be negative' };
  }

  return prisma.produce.update({
    where: { id: produceId },
    data: {
      name: body.name,
      description: body.description,
      price: body.price !== undefined ? parseFloat(body.price) : undefined,
      category: body.category,
      availableQuantity: body.availableQuantity !== undefined ? parseInt(body.availableQuantity) : undefined,
    },
  });
};

// Vendor: delete their own produce
const deleteProduce = async (userId, produceId) => {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendorProfile) throw { status: 404, message: 'Vendor profile not found' };

  const produce = await prisma.produce.findUnique({ where: { id: produceId } });
  if (!produce) throw { status: 404, message: 'Produce not found' };

  if (produce.vendorId !== vendorProfile.id) {
    throw { status: 403, message: 'You can only delete your own produce' };
  }

  await prisma.produce.delete({ where: { id: produceId } });
  return { message: 'Produce deleted successfully' };
};

// Vendor: get only their own produce
const getMyProduce = async (userId) => {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendorProfile) throw { status: 404, message: 'Vendor profile not found' };

  return prisma.produce.findMany({
    where: { vendorId: vendorProfile.id },
    orderBy: { id: 'desc' },
  });
};

module.exports = {
  getAllProduce,
  getProduceById,
  createProduce,
  updateProduce,
  deleteProduce,
  getMyProduce,
};