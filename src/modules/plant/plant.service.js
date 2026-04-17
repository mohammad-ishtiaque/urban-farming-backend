// src/modules/plant/plant.service.js
const prisma = require('../../config/prisma');

const getMyPlants = async (userId) => {
  return prisma.plantTracking.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

const addPlant = async (userId, body) => {
  const { plantName, species, notes, harvestDate } = body;
  if (!plantName) throw { status: 400, message: 'Plant name is required' };

  return prisma.plantTracking.create({
    data: {
      userId,
      plantName,
      species,
      notes,
      harvestDate: harvestDate ? new Date(harvestDate) : null,
    },
  });
};

const updatePlant = async (userId, plantId, body) => {
  const plant = await prisma.plantTracking.findUnique({ where: { id: plantId } });
  if (!plant) throw { status: 404, message: 'Plant not found' };
  if (plant.userId !== userId) throw { status: 403, message: 'Access denied' };

  return prisma.plantTracking.update({
    where: { id: plantId },
    data: {
      plantName: body.plantName,
      species: body.species,
      healthStatus: body.healthStatus,
      growthStage: body.growthStage,
      notes: body.notes,
      harvestDate: body.harvestDate ? new Date(body.harvestDate) : undefined,
      updatedAt: new Date(),
    },
  });
};

const deletePlant = async (userId, plantId) => {
  const plant = await prisma.plantTracking.findUnique({ where: { id: plantId } });
  if (!plant) throw { status: 404, message: 'Plant not found' };
  if (plant.userId !== userId) throw { status: 403, message: 'Access denied' };

  await prisma.plantTracking.delete({ where: { id: plantId } });
  return { message: 'Plant removed' };
};

module.exports = { getMyPlants, addPlant, updatePlant, deletePlant };