// src/app.js — COMPLETE FINAL VERSION
const express = require('express');
const app = express();

app.use(express.json());

const authRoutes = require('./modules/auth/auth.routes');
const produceRoutes = require('./modules/produce/produce.routes');
const farmRoutes = require('./modules/farm/farm.routes');
const orderRoutes = require('./modules/order/order.routes');
const communityRoutes = require('./modules/community/community.routes');
const certRoutes = require('./modules/certification/cert.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const profileRoutes = require('./modules/profile/profile.routes');
const plantRoutes = require('./modules/plant/plant.routes');

app.use('/api/auth', authRoutes);
app.use('/api/produce', produceRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/certifications', certRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/plants', plantRoutes);

app.get('/', (req, res) =>
  res.json({ success: true, message: 'Urban Farming API Running' })
);

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;