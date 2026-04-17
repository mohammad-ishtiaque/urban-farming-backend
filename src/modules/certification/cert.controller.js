const certService = require('./cert.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const submitCert = async (req, res) => {
  try {
    const result = await certService.submitCert(req.user.userId, req.body);
    return sendSuccess(res, 201, 'Certification submitted', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

const getMyCerts = async (req, res) => {
  try {
    const result = await certService.getMyCerts(req.user.userId);
    return sendSuccess(res, 200, 'Certifications fetched', result);
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};

module.exports = { submitCert, getMyCerts };