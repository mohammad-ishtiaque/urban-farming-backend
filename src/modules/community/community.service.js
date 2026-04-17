const prisma = require('../../config/prisma');
const { paginate, paginateMeta } = require('../../utils/paginate');

const getAllPosts = async (query) => {
  const { page, limit, skip, take } = paginate(query.page, query.limit);

  const [items, total] = await Promise.all([
    prisma.communityPost.findMany({
      skip,
      take,
      include: { user: { select: { name: true, role: true } } },
      orderBy: { postDate: 'desc' },
    }),
    prisma.communityPost.count(),
  ]);

  return { items, meta: paginateMeta(total, page, limit) };
};

const createPost = async (userId, body) => {
  const { postContent } = body;
  if (!postContent) throw { status: 400, message: 'Post content is required' };

  return prisma.communityPost.create({
    data: { userId, postContent },
    include: { user: { select: { name: true } } },
  });
};

const deletePost = async (userId, postId, role) => {
  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post) throw { status: 404, message: 'Post not found' };

  // Admin can delete any post, user can only delete their own
  if (role !== 'ADMIN' && post.userId !== userId) {
    throw { status: 403, message: 'You can only delete your own posts' };
  }

  await prisma.communityPost.delete({ where: { id: postId } });
  return { message: 'Post deleted' };
};

module.exports = { getAllPosts, createPost, deletePost };