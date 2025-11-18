# Community Module Implementation Guide

## ✅ Đã hoàn thành

1. **Side Navigation** - Component SideNav.tsx với style Instagram/Threads
2. **Follow System** - Models, API endpoints, controller
3. **Hashtag System** - Models, parsing utilities, backend integration
4. **Mention System** - Parsing, notifications, backend integration
5. **Edited Indicator** - Models updated với isEdited và editedAt
6. **User Model Updates** - Thêm followersCount, followingCount, bio, coverImage

## 📋 Cần triển khai tiếp theo

### 1. Profile Page (Hoàn thiện)
**File cần tạo:**
- `frontend/src/app/[locale]/community/profile/[userId]/page.tsx`
- `frontend/src/components/features/community/ProfileHeader.tsx`
- `frontend/src/components/features/community/ProfileStats.tsx`
- `frontend/src/components/features/community/ProfilePosts.tsx`

**API cần tạo:**
- `GET /api/community/users/:userId/profile` - Lấy thông tin profile
- `PUT /api/community/users/:userId/profile` - Cập nhật profile (avatar, cover, bio)

**Features:**
- Avatar upload
- Cover image upload
- Bio editor
- Hiển thị target TOEIC, part levels
- Hiển thị badges
- Hiển thị posts của user
- Follow/Unfollow button
- Follower/Following lists

### 2. Notification Center
**File cần tạo:**
- `frontend/src/components/features/community/NotificationCenter.tsx`
- `frontend/src/components/features/community/NotificationItem.tsx`

**API cần cập nhật:**
- `GET /api/notifications` - Lấy danh sách notifications với pagination
- `PUT /api/notifications/:id/read` - Đánh dấu đã đọc
- `PUT /api/notifications/read-all` - Đánh dấu tất cả đã đọc

**Features:**
- Dropdown notification center
- Realtime updates via socket
- Infinite scroll
- Mark as read
- Click để navigate

### 3. Trending Feed
**File cần tạo:**
- `frontend/src/app/[locale]/community/trending/page.tsx`
- `backend/src/modules/community/trending.controller.ts`

**API cần tạo:**
- `GET /api/community/posts/trending?period=24h|7d` - Lấy trending posts

**Algorithm:**
```typescript
// Score = (likes * 2 + comments * 3 + reposts * 1.5) / hours_since_post
// Filter posts from last 24h or 7 days
// Sort by score descending
```

### 4. Study Groups
**File cần tạo:**
- `frontend/src/app/[locale]/community/groups/page.tsx`
- `frontend/src/app/[locale]/community/groups/[groupId]/page.tsx`
- `frontend/src/components/features/community/GroupCard.tsx`
- `frontend/src/components/features/community/GroupHeader.tsx`
- `backend/src/modules/community/group.controller.ts`
- `backend/src/modules/community/group.routes.ts`

**API cần tạo:**
- `POST /api/community/groups` - Tạo group
- `GET /api/community/groups` - List groups
- `GET /api/community/groups/:groupId` - Get group details
- `POST /api/community/groups/:groupId/join` - Join group
- `DELETE /api/community/groups/:groupId/leave` - Leave group
- `GET /api/community/groups/:groupId/posts` - Get group posts
- `POST /api/community/groups/:groupId/posts` - Create post in group

### 5. Poll System
**File cần tạo:**
- `frontend/src/components/features/community/PollCard.tsx`
- `backend/src/modules/community/poll.controller.ts`

**API cần tạo:**
- `POST /api/community/posts/:postId/poll` - Tạo poll
- `POST /api/community/polls/:pollId/vote` - Vote cho option
- `GET /api/community/polls/:pollId` - Get poll results

**Features:**
- Multi-option polls
- Realtime vote updates
- 1 vote per user limit
- Progress bars
- Vote count

### 6. Emoji Reactions
**File cần tạo:**
- `frontend/src/components/features/community/ReactionPicker.tsx`
- `frontend/src/components/features/community/ReactionButton.tsx`
- `backend/src/modules/community/reaction.controller.ts`

**API cần tạo:**
- `POST /api/community/posts/:postId/reaction` - Add/update reaction
- `DELETE /api/community/posts/:postId/reaction` - Remove reaction
- `GET /api/community/posts/:postId/reactions` - Get all reactions

**Reactions:** ❤️ 👍 😂 😲 😢 😡

### 7. Infinite Scroll Feed
**File cần cập nhật:**
- `frontend/src/components/features/community/CommunityPageClient.tsx`
- Tạo hook: `frontend/src/hooks/community/useInfinitePosts.ts`

**Implementation:**
- Sử dụng Intersection Observer
- Load more khi scroll đến cuối
- Loading states
- Error handling

### 8. Typing Indicator
**File cần tạo:**
- `frontend/src/components/features/community/TypingIndicator.tsx`

**Socket Events:**
- `comment:typing` - Emit khi user đang gõ
- `comment:typing-stop` - Emit khi user dừng gõ
- `comment:user-typing` - Nhận event từ server

**Backend:**
- Thêm socket handler trong socket.service.ts

### 9. Global Search
**File cần tạo:**
- `frontend/src/app/[locale]/community/search/page.tsx`
- `frontend/src/components/features/community/SearchBar.tsx`
- `frontend/src/components/features/community/SearchResults.tsx`
- `backend/src/modules/community/search.controller.ts`

**API cần tạo:**
- `GET /api/community/search?q=query&type=all|users|posts|hashtags` - Search

**Features:**
- Autocomplete
- Search users, posts, hashtags
- Recent searches
- Popular searches

### 10. Hashtag Page
**File cần tạo:**
- `frontend/src/app/[locale]/community/hashtag/[tag]/page.tsx`
- `backend/src/modules/community/hashtag.controller.ts`

**API cần tạo:**
- `GET /api/community/hashtags/:tag` - Get posts with hashtag
- `GET /api/community/hashtags/trending` - Get trending hashtags

### 11. Discuss This Question Integration
**File cần tạo:**
- `frontend/src/components/features/practice/DiscussQuestionButton.tsx`
- `backend/src/modules/community/discuss.controller.ts`

**API cần tạo:**
- `POST /api/community/posts/discuss-question` - Tạo post từ practice attempt

**Features:**
- Tự động tạo post với:
  - Question content
  - Answer options
  - Correct answer
  - Image (nếu có)
  - Transcript (nếu có)
  - Link đến practice attempt

### 12. Study Streak Integration
**File cần tạo:**
- `frontend/src/components/features/community/StreakBadge.tsx`
- `frontend/src/components/features/community/ActivityHeatmap.tsx`

**API cần tạo:**
- `GET /api/community/users/:userId/activity` - Get activity data
- `GET /api/community/users/:userId/streak` - Get streak info

**Features:**
- Kết hợp learning streak + community activity
- Heatmap hiển thị ngày hoạt động
- Share streak badge

### 13. Refactor PostCard Component
**File cần cập nhật:**
- `frontend/src/components/features/community/PostCard.tsx`

**Updates:**
- Thêm TextWithHighlights cho content
- Hiển thị "(đã chỉnh sửa)" nếu isEdited
- Thêm ReactionPicker
- Thêm PollCard nếu có poll
- Cải thiện MediaGallery
- Infinite scroll comments preview

### 14. Refactor NewPostForm
**File cần cập nhật:**
- `frontend/src/components/features/community/NewPostForm.tsx`

**Updates:**
- Multi-image preview với reorder
- Xóa ảnh riêng lẻ
- Preview video
- Better error handling
- Character counter
- Hashtag suggestions
- Mention autocomplete

### 15. Following Feed
**File cần tạo:**
- `frontend/src/app/[locale]/community/following/page.tsx`

**API cần tạo:**
- `GET /api/community/posts/following` - Lấy posts từ users đang follow

### 16. Explore Page
**File cần tạo:**
- `frontend/src/app/[locale]/community/explore/page.tsx`

**Features:**
- Trending posts
- Suggested users
- Popular hashtags
- Suggested groups

## 🔧 Utility Functions cần tạo

### Backend
- `backend/src/shared/utils/trendingScore.ts` - Tính trending score
- `backend/src/shared/utils/userResolver.ts` - Resolve username to userId

### Frontend
- `frontend/src/hooks/community/useInfiniteScroll.ts` - Infinite scroll hook
- `frontend/src/hooks/community/useMentionAutocomplete.ts` - Mention autocomplete
- `frontend/src/hooks/community/useHashtagSuggestions.ts` - Hashtag suggestions
- `frontend/src/hooks/community/useNotifications.ts` - Notification hook
- `frontend/src/hooks/community/useTypingIndicator.ts` - Typing indicator hook

## 📝 Notes

1. **Socket Events** - Cần cập nhật socket.service.ts với các events mới:
   - `community:reaction-updated`
   - `community:poll-voted`
   - `community:user-typing`
   - `community:new-follow`
   - `community:group-post`

2. **Database Indexes** - Đảm bảo có indexes cho:
   - CommunityPost.tags
   - CommunityPost.mentions
   - CommunityPost.groupId
   - CommunityPost.createdAt (cho trending)
   - Follow.followerId, followingId
   - Hashtag.name, postsCount

3. **Performance** - Cân nhắc:
   - Cache trending posts
   - Pagination cho tất cả lists
   - Lazy loading images
   - Virtual scrolling cho long lists

4. **Testing** - Nên test:
   - Follow/unfollow flow
   - Hashtag extraction và storage
   - Mention notifications
   - Poll voting
   - Reaction updates
   - Infinite scroll

## 🚀 Priority Order

1. Profile Page (High priority - core feature)
2. Notification Center (High priority - user engagement)
3. Infinite Scroll (High priority - UX improvement)
4. Poll System (Medium priority - useful for TOEIC questions)
5. Emoji Reactions (Medium priority - engagement)
6. Trending Feed (Medium priority)
7. Study Groups (Low priority - can be added later)
8. Global Search (Low priority)
9. Typing Indicator (Low priority - nice to have)
10. Discuss This Question (Medium priority - TOEIC specific)
11. Study Streak Integration (Low priority)



