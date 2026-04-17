const prisma = require('../../config/prisma');

const getAllUsers = async () => {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
};

const updateUserStatus = async (adminId, targetUserId, body) => {
  const { status } = body;

  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    throw { status: 400, message: 'Status must be ACTIVE or INACTIVE' };
  }
  if (adminId === targetUserId) {
    throw { status: 400, message: 'You cannot change your own account status' };
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw { status: 404, message: 'User not found' };

  return prisma.user.update({
    where: { id: targetUserId },
    data: { status },
    select: { id: true, name: true, email: true, status: true },
  });
};

const approveProduce = async (produceId, body) => {
  const { certificationStatus } = body;

  if (!['APPROVED', 'REJECTED'].includes(certificationStatus)) {
    throw { status: 400, message: 'certificationStatus must be APPROVED or REJECTED' };
  }

  const produce = await prisma.produce.findUnique({ where: { id: produceId } });
  if (!produce) throw { status: 404, message: 'Produce not found' };

  return prisma.produce.update({
    where: { id: produceId },
    data: { certificationStatus },
  });
};

const approveVendor = async (vendorProfileId, body) => {
  const { certificationStatus } = body;

  if (!['APPROVED', 'REJECTED'].includes(certificationStatus)) {
    throw { status: 400, message: 'certificationStatus must be APPROVED or REJECTED' };
  }

  const vendor = await prisma.vendorProfile.findUnique({ where: { id: vendorProfileId } });
  if (!vendor) throw { status: 404, message: 'Vendor profile not found' };

  return prisma.vendorProfile.update({
    where: { id: vendorProfileId },
    data: { certificationStatus },
  });
};

const getDashboard = async () => {
  const [users, vendors, produce, orders] = await Promise.all([
    prisma.user.count(),
    prisma.vendorProfile.count(),
    prisma.produce.count(),
    prisma.order.count(),
  ]);
  return { totalUsers: users, totalVendors: vendors, totalProduce: produce, totalOrders: orders };
};

module.exports = { getAllUsers, updateUserStatus, approveProduce, approveVendor, getDashboard };
