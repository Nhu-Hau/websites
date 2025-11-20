/**
 * Calculate trending score for a post
 * Score = (likes * 2 + comments * 3 + reposts * 1.5) / hours_since_post
 */
export function calculateTrendingScore(post: {
  likesCount: number;
  commentsCount: number;
  repostCount: number;
  createdAt: Date | string;
}): number {
  const now = new Date();
  const createdAt = typeof post.createdAt === "string" 
    ? new Date(post.createdAt) 
    : post.createdAt;
  
  const hoursSincePost = Math.max(
    1,
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
  );

  const likes = post.likesCount || 0;
  const comments = post.commentsCount || 0;
  const reposts = post.repostCount || 0;

  const score = (likes * 2 + comments * 3 + reposts * 1.5) / hoursSincePost;

  return score;
}

/**
 * Filter and sort posts by trending score
 */
export function getTrendingPosts<T extends {
  likesCount?: number;
  commentsCount?: number;
  repostCount?: number;
  createdAt: Date | string;
}>(
  posts: T[],
  period: "24h" | "7d" = "24h"
): T[] {
  const now = new Date();
  const hours = period === "24h" ? 24 : 168; // 7 days = 168 hours
  const cutoffTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

  const filtered = posts.filter((post) => {
    const createdAt = typeof post.createdAt === "string"
      ? new Date(post.createdAt)
      : post.createdAt;
    return createdAt >= cutoffTime;
  });

  return filtered
    .map((post) => ({
      post,
      score: calculateTrendingScore({
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        repostCount: post.repostCount || 0,
        createdAt: post.createdAt,
      }),
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.post);
}







