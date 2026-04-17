const prisma = require('../../config/prisma');

const submitCert = async (userId, body) => {
  const { certifyingAgency, certificationDate } = body;

  if (!certifyingAgency || !certificationDate) {
    throw { status: 400, message: 'Agency and certification date are required' };
  }

  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendorProfile) throw { status: 404, message: 'Vendor profile not found' };

  return prisma.sustainabilityCert.create({
    data: {
      vendorId: vendorProfile.id,
      certifyingAgency,
      certificationDate: new Date(certificationDate),
    },
  });
};

const getMyCerts = async (userId) => {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendorProfile) throw { status: 404, message: 'Vendor profile not found' };

  return prisma.sustainabilityCert.findMany({
    where: { vendorId: vendorProfile.id },
  });
};

module.exports = { submitCert, getMyCerts };