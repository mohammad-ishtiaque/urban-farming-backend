const prisma = require('../../config/prisma');
const { paginate, paginateMeta } = require('../../utils/paginate');

const getAllFarms = async (query) => {
  const { page, limit, skip, take } = paginate(query.page, query.limit);
  const where = { availability: true };

  if (query.location) {
    where.location = { contains: query.location, mode: 'insensitive' };
  }

  const [items, total] = await Promise.all([
    prisma.rentalSpace.findMany({
      where,
      skip,
      take,
      include: { vendor: { select: { farmName: true, farmLocation: true } } },
    }),
    prisma.rentalSpace.count({ where }),
  ]);

  return { items, meta: paginateMeta(total, page, limit) };
};

const getFarmById = async (id) => {
  const farm = await prisma.rentalSpace.findUnique({
    where: { id },
    include: { vendor: { select: { farmName: true, farmLocation: true } } },
  });
  if (!farm) throw { status: 404, message: 'Rental space not found' };
  return farm;
};

const createFarm = async (userId, body) => {
  const { location, size, price } = body;

  if (!location || !size || price === undefined) {
    throw { status: 400, message: 'Location, size, and price are required' };
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    throw { status: 400, message: 'Price must be a positive number' };
  }

  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendorProfile) throw { status: 404, message: 'Vendor profile not found' };

  return prisma.rentalSpace.create({
    data: {
      vendorId: vendorProfile.id,
      location,
      size,
      price: parsedPrice,
      availability: true,
    },
  });
};

const updateFarm = async (userId, farmId, body) => {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendorProfile) throw { status: 404, message: 'Vendor profile not found' };

  const farm = await prisma.rentalSpace.findUnique({ where: { id: farmId } });
  if (!farm) throw { status: 404, message: 'Farm not found' };
  if (farm.vendorId !== vendorProfile.id) throw { status: 403, message: 'Access denied' };

  if (body.price !== undefined) {
    const p = parseFloat(body.price);
    if (isNaN(p) || p <= 0) throw { status: 400, message: 'Price must be a positive number' };
  }

  return prisma.rentalSpace.update({
    where: { id: farmId },
    data: {
      location: body.location,
      size: body.size,
      price: body.price !== undefined ? parseFloat(body.price) : undefined,
      availability: body.availability,
    },
  });
};

const deleteFarm = async (userId, farmId) => {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendorProfile) throw { status: 404, message: 'Vendor profile not found' };

  const farm = await prisma.rentalSpace.findUnique({ where: { id: farmId } });
  if (!farm) throw { status: 404, message: 'Farm not found' };
  if (farm.vendorId !== vendorProfile.id) throw { status: 403, message: 'Access denied' };

  await prisma.rentalSpace.delete({ where: { id: farmId } });
  return { message: 'Farm deleted successfully' };
};

// Vendor creates their profile
const createVendorProfile = async (userId, body) => {
  const { farmName, farmLocation } = body;

  if (!farmName || !farmLocation) {
    throw { status: 400, message: 'Farm name and location are required' };
  }

  const exists = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (exists) throw { status: 409, message: 'Vendor profile already exists' };

  return prisma.vendorProfile.create({
    data: { userId, farmName, farmLocation },
  });
};

module.exports = { getAllFarms, getFarmById, createFarm, updateFarm, deleteFarm, createVendorProfile };