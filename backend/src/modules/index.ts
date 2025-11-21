// backend/src/modules/index.ts
// Central export for all module routes

import authRoutes from "./auth/auth.routes";
import adminAuthRoutes from "./admin/admin-auth.routes";
import adminRoutes from "./admin/admin.routes";
import adminChatRoutes from "./admin/admin-chat.routes";
import chatRoutes from "./study-room/chat.routes";
import placementRoutes from "./placement/placement.routes";
import partsRoutes from "./practice/parts.routes";
import practiceRoutes from "./practice/practice.routes";
import communityRoutes from "./community/community.routes";
import notificationRoutes from "./notification/notification.routes";
import paymentsRoutes from "./payment/payment.routes";
import socketAuthRoutes from "./study-room/socket-auth.routes";
import studyroomRoutes from "./study-room/study-room.routes";
import progressRoutes from "./progress/progress.routes";
import dashboardRoutes from "./dashboard/dashboard.routes";
import badgeRoutes from "./badge/badge.routes";
import studyScheduleRoutes from "./study-schedule/study-schedule.routes";
import { newsRoutes } from "./news/news.routes";
import vocabularyRoutes from "./vocabulary/vocabulary.routes";
import teacherLeadRoutes from "./teacher-lead/teacher-lead.routes";
import profileRoutes from "./profile/profile.routes";

export {
  authRoutes,
  adminAuthRoutes,
  adminRoutes,
  adminChatRoutes,
  chatRoutes,
  placementRoutes,
  partsRoutes,
  practiceRoutes,
  communityRoutes,
  notificationRoutes,
  paymentsRoutes,
  socketAuthRoutes,
  studyroomRoutes,
  progressRoutes,
  dashboardRoutes,
  badgeRoutes,
  studyScheduleRoutes,
  newsRoutes,
  vocabularyRoutes,
  teacherLeadRoutes,
  profileRoutes,
};

