// src/utils/paginate.js

const paginate = (page = 1, limit = 10) => {
  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (parsedPage - 1) * parsedLimit;
  return { skip, take: parsedLimit, page: parsedPage, limit: parsedLimit };
};

const paginateMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

module.exports = { paginate, paginateMeta };