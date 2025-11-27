// src/services/ChatService.ts
import type { IChatMessage } from "../../shared/models/ChatMessage";
import { ChatMessage } from "../../shared/models/ChatMessage";
import { User, type IUser } from "../../shared/models/User";
import { ProgressAttempt } from "../../shared/models/ProgressAttempt";
import { PracticeAttempt } from "../../shared/models/PracticeAttempt";
import { PlacementAttempt } from "../../shared/models/PlacementAttempt";
import { Types } from "mongoose";

type OpenAIRole = "system" | "user" | "assistant";

interface UserProfile {
  name: string;
  level?: number;
  toeicPred?: {
    overall: number | null;
    listening: number | null;
    reading: number | null;
  } | null;
  partLevels?: Record<string, 1 | 2 | 3>;
  access?: "free" | "premium";
}

interface AIProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

/** Mô tả các collections trong MongoDB */
interface CollectionInfo {
  name: string;
  description: string;
  keywords: string[]; // Từ khóa để nhận diện khi nào cần lấy dữ liệu từ collection này
}

/** Context từ database để cung cấp cho AI */
interface DatabaseContext {
  userProgress?: {
    recentAttempts: any[];
    stats: {
      totalAttempts: number;
      averageAccuracy: number;
      weakParts: string[];
    };
  };
  practiceHistory?: {
    recentPractices: any[];
    partStats: Record<string, { attempts: number; avgAccuracy: number }>;
  };
  placementHistory?: {
    recentPlacements: any[];
    latestLevel: number | null;
  };
}

export class ChatService {
  private providers: AIProvider[] = [];

  private static readonly OUT_OF_SCOPE =
    "Xin lỗi, mình chỉ hỗ trợ **Tiếng Anh** (TOEIC/IELTS, ngữ pháp, từ vựng, phát âm, kỹ năng đọc–nghe–nói–viết...). Hãy hỏi mình về các chủ đề đó nhé!";

  /** Danh sách các collections và mô tả */
  private readonly collections: CollectionInfo[] = [
    {
      name: "users",
      description:
        "Thông tin người dùng: tên, email, trình độ, điểm TOEIC dự đoán, level từng part",
      keywords: [
        "thông tin",
        "profile",
        "trình độ",
        "level",
        "toeic",
        "điểm",
        "người dùng",
        "tài khoản",
      ],
    },
    {
      name: "progressattempts",
      description:
        "Kết quả bài test progress: điểm tổng, listening, reading, accuracy, weak parts, thời gian làm bài",
      keywords: [
        "progress",
        "test",
        "kết quả",
        "điểm",
        "accuracy",
        "weak",
        "yếu",
        "cần cải thiện",
        "lịch sử test",
      ],
    },
    {
      name: "practiceattempts",
      description:
        "Kết quả bài practice theo part và level: partKey, level, số câu đúng/sai, accuracy, thời gian",
      keywords: [
        "practice",
        "luyện tập",
        "part",
        "bài tập",
        "kết quả practice",
        "lịch sử practice",
      ],
    },
    {
      name: "placementattempts",
      description:
        "Kết quả bài placement test: điểm tổng, listening, reading, level được xác định",
      keywords: [
        "placement",
        "kiểm tra đầu vào",
        "xác định trình độ",
        "placement test",
      ],
    },
    {
      name: "chatmessages",
      description: "Lịch sử chat giữa người dùng và AI",
      keywords: ["chat", "lịch sử", "tin nhắn", "câu hỏi trước", "đã hỏi"],
    },
  ];

  constructor() {
    // Khởi tạo danh sách providers với thứ tự ưu tiên
    const providers: AIProvider[] = [];

    // Provider 1: OpenAI (ưu tiên cao nhất)
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      providers.push({
        name: "OpenAI",
        apiKey: openaiKey,
        baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      });
    }

    // Provider 2: Groq (dự phòng)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      providers.push({
        name: "Groq",
        apiKey: groqKey,
        baseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
        model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      });
    }

    this.providers = providers;

    if (this.providers.length === 0) {
      console.warn("[ChatService] Không có AI provider nào được cấu hình!");
      console.warn(
        "[ChatService] Vui lòng cấu hình ít nhất một trong các biến môi trường sau:"
      );
      console.warn("  - OPENAI_API_KEY (hoặc)");
      console.warn("  - GROQ_API_KEY");
    } else {
      console.log(
        `[ChatService] Đã khởi tạo ${
          this.providers.length
        } AI provider(s): ${this.providers
          .map((p) => `${p.name} (${p.model})`)
          .join(", ")}`
      );
    }
  }

  /** System prompt: Trợ lý Tiếng Anh cho người Việt – chuẩn hóa và chuyên nghiệp */
  private buildSystemPrompt(userProfile?: UserProfile): {
    role: "system";
    content: string;
  } {
    const basePrompt = `Bạn là trợ lý Tiếng Anh chuyên nghiệp dành cho người Việt, chuyên về TOEIC/IELTS.

**Quy tắc:**
- Ngôn ngữ: Giải thích bằng Tiếng Việt, ví dụ bằng Tiếng Anh (trừ khi người dùng yêu cầu khác). TUYỆT ĐỐI KHÔNG sử dụng tiếng Trung Quốc (中文, 汉语) hoặc bất kỳ ký tự Trung Quốc nào trong câu trả lời. Chỉ sử dụng Tiếng Việt và Tiếng Anh.
- Phạm vi: Chỉ hỗ trợ Tiếng Anh (TOEIC/IELTS, ngữ pháp, từ vựng, kỹ năng, dịch thuật, sửa lỗi, lộ trình học). Từ chối lịch sự nếu câu hỏi ngoài phạm vi.
- Phong cách: Ngắn gọn, rõ ràng, dùng Markdown hợp lý. Không dùng emoji.
- Thích nghi: Đánh giá trình độ (beginner/intermediate/advanced) và điều chỉnh độ khó phù hợp.
- Sửa lỗi: Lỗi → Sửa → Giải thích → Bài tập 1 câu.
- Dịch thuật: Bản dịch chính xác kèm 2-3 ghi chú về từ vựng/cấu trúc.
- TOEIC: Nhận diện Part 1-7, đưa đáp án ngắn gọn kèm keyword/distractor và 1 mẹo làm bài.
- Tương tác: Nếu câu hỏi mơ hồ, hỏi lại 1 câu kèm 2-3 lựa chọn (A/B/C).
- Trung thực: Nếu thiếu dữ liệu, nói "Chưa đủ thông tin" và đề nghị cung cấp thông tin cần thiết.

**Cấu trúc trả lời** (tối đa 3 phần):
1. Ý chính (1-2 câu tóm tắt)
2. Ví dụ minh họa cụ thể
3. Gợi ý luyện tập hoặc câu hỏi tiếp theo`;

    // Nếu có thông tin user, thêm phần cá nhân hóa
    if (userProfile) {
      const personalizedSection = this.buildPersonalizedSection(userProfile);
      return {
        role: "system",
        content: `${basePrompt}\n\n## Thông tin người học\n${personalizedSection}\n\n**Lưu ý quan trọng**: Khi người dùng hỏi về trình độ hiện tại hoặc level của họ, bạn PHẢI đề cập chi tiết về trình độ từng phần TOEIC (Part 1-7) nếu có thông tin. Không chỉ nói về trình độ tổng quát mà cần liệt kê cụ thể từng part và level tương ứng.\n\nHãy sử dụng thông tin trên để điều chỉnh cách giải thích và độ khó của ví dụ/bài tập cho phù hợp với trình độ của ${userProfile.name}.`,
      };
    }

    return {
      role: "system",
      content: basePrompt,
    };
  }

  /** Tạo phần cá nhân hóa dựa trên thông tin user */
  private buildPersonalizedSection(profile: UserProfile): string {
    const parts: string[] = [];

    // Tên người dùng
    parts.push(`- **Tên**: ${profile.name}`);

    // Trình độ tổng quát
    if (profile.level) {
      const levelMap: Record<number, string> = {
        1: "Beginner (Sơ cấp)",
        2: "Intermediate (Trung cấp)",
        3: "Advanced (Cao cấp)",
      };
      parts.push(
        `- **Trình độ**: ${levelMap[profile.level] || `Level ${profile.level}`}`
      );
    }

    // Điểm TOEIC dự đoán
    if (profile.toeicPred) {
      const { overall, listening, reading } = profile.toeicPred;
      const toeicParts: string[] = [];
      if (overall !== null) toeicParts.push(`Tổng: ${overall}`);
      if (listening !== null) toeicParts.push(`Listening: ${listening}`);
      if (reading !== null) toeicParts.push(`Reading: ${reading}`);
      if (toeicParts.length > 0) {
        parts.push(`- **TOEIC dự đoán**: ${toeicParts.join(", ")} điểm`);
      }
    }

    // Trình độ từng phần TOEIC
    if (profile.partLevels && Object.keys(profile.partLevels).length > 0) {
      const levelMap: Record<number, string> = {
        1: "Beginner",
        2: "Intermediate",
        3: "Advanced",
      };

      // Xử lý cả hai định dạng: nested { part: { "1": level } } hoặc flat { "part.1": level }
      let partLevelsEntries: Array<{
        partKey: string;
        partNumber: number;
        level: number;
      }> = [];

      // Kiểm tra dạng nested: { part: { "1": 1, "2": 2, ... } }
      if (
        profile.partLevels.part &&
        typeof profile.partLevels.part === "object"
      ) {
        partLevelsEntries = Object.entries(profile.partLevels.part)
          .map(([partNum, level]) => {
            const partNumber = parseInt(partNum, 10);
            const levelNum =
              typeof level === "number" ? level : parseInt(String(level), 10);
            return {
              partKey: `part.${partNumber}`,
              partNumber,
              level: levelNum,
            };
          })
          .filter(
            (p) =>
              !isNaN(p.partNumber) && p.partNumber >= 1 && p.partNumber <= 7
          );
      } else {
        // Dạng flat: { "part.1": 1, "part.2": 2, ... }
        partLevelsEntries = Object.entries(profile.partLevels)
          .map(([part, level]) => {
            const partNum = part.replace(/^part\./, ""); // Extract số từ "part.1" -> "1"
            const partNumber = parseInt(partNum, 10);
            const levelNum =
              typeof level === "number" ? level : parseInt(String(level), 10);
            return {
              partKey: part,
              partNumber,
              level: levelNum,
            };
          })
          .filter(
            (p) =>
              !isNaN(p.partNumber) && p.partNumber >= 1 && p.partNumber <= 7
          );
      }

      // Chỉ hiển thị nếu có entries hợp lệ
      if (partLevelsEntries.length > 0) {
        // Sắp xếp theo số part
        partLevelsEntries.sort((a, b) => a.partNumber - b.partNumber);

        // Format danh sách level từng part - hiển thị chi tiết từng part
        const partLevelsList = partLevelsEntries
          .map(({ partNumber, level }) => {
            const levelName = levelMap[level] || `Level ${level}`;
            return `Part ${partNumber}: ${levelName} (Level ${level})`;
          })
          .join("\n  ");

        parts.push(`- **Trình độ theo phần TOEIC**:\n  ${partLevelsList}`);

        // Thêm gợi ý về phần cần cải thiện (level thấp nhất)
        const sortedByLevel = [...partLevelsEntries].sort(
          (a, b) => a.level - b.level
        );

        if (sortedByLevel.length > 0) {
          const weakestParts = sortedByLevel.filter(
            (p) => p.level === sortedByLevel[0].level
          );
          if (weakestParts.length > 0 && weakestParts[0].level < 3) {
            const partsStr = weakestParts
              .map((p) => `Part ${p.partNumber}`)
              .join(", ");
            parts.push(
              `- **Cần tập trung cải thiện**: ${partsStr} (đang ở mức ${
                levelMap[weakestParts[0].level]
              })`
            );
          }
        }
      }
    }

    // Loại tài khoản
    if (profile.access) {
      parts.push(
        `- **Tài khoản**: ${profile.access === "premium" ? "Premium" : "Free"}`
      );
    }

    return parts.join("\n");
  }

  /** Bộ lọc “chỉ Tiếng Anh” – nới để không chặn nhầm câu chữa ngữ pháp */
private isEnglishRelated(messages: Partial<IChatMessage>[]) {
  const lastMsg = messages.length
    ? String(messages[messages.length - 1]?.content ?? "")
    : "";
  const lower = lastMsg.toLowerCase().trim();

  if (!lastMsg.trim()) return false;

  // 0) Một số regex dùng chung
  const directRe =
    /(tiếng anh|english|toeic|ielts|grammar|ngữ pháp|vocabulary|từ vựng|phát âm|pronunciation|listening|reading|writing|speaking|dịch|translate|sửa câu|chữa câu|thì|tenses|part\s*5|part\s*6|part\s*7|bài tập tiếng anh|collocation|phrasal verb|ielts task)/i;

  const hasAsciiWord = /[a-z][a-z'\-]+/i.test(lastMsg); // có từ a-z
  const viCueRe =
    /(sai|đúng|sửa|chữa|nghĩa|dịch|câu này|check|kiểm tra|phân tích|giải thích)/i;

  const technicalRe =
    /(router|openwrt|docker|git|github|gmail|smtp|openai|mp3|android|rom|vlan|zerotier|mongodb|express|react|next\.js|node\.js|typescript|javascript|frontend|backend|localhost|http(s)?:\/\/)/i;

  // 1) Từ khóa trực tiếp về English/ELT -> luôn true
  if (directRe.test(lower)) return true;

  // 2) Có từ tiếng Anh + tín hiệu "chữa bài" tiếng Việt (vd: "he are students sai chỗ nào")
  if (hasAsciiWord && viCueRe.test(lower)) return true;

  // 3) Nếu chứa nhiều từ khoá kỹ thuật mà KHÔNG hề nhắc gì đến học tiếng Anh -> false
  // (đặt trước khi dùng heuristic tỉ lệ chữ cái)
  if (technicalRe.test(lower)) return false;

  // 4) Heuristic: tỉ lệ chữ cái tiếng Anh cao -> có thể là câu English thuần
  const letters = (lastMsg.match(/[a-z]/gi) || []).length;
  const ratio = letters / Math.max(lastMsg.length, 1);

  // Có thể chỉnh ngưỡng lên cao hơn một chút để tránh bắt nhầm
  // ví dụ: câu dài, > ~20 ký tự, chủ yếu là a-z và khoảng trắng
  const isLikelyEnglishSentence =
    ratio > 0.4 && lastMsg.length > 15 && /\s/.test(lastMsg);

  if (isLikelyEnglishSentence) return true;

  // 5) Còn lại -> không liên quan tiếng Anh
  return false;
}

  /** Tính level từ điểm TOEIC */
  private calculateLevelFromToeic(
    toeicPred: { overall: number | null } | null
  ): number | undefined {
    if (!toeicPred || toeicPred.overall === null) return undefined;

    const score = toeicPred.overall;
    if (score < 400) return 1; // Beginner
    if (score < 700) return 2; // Intermediate
    return 3; // Advanced
  }

  /** Phân tích câu hỏi để xác định cần lấy dữ liệu từ collection nào */
  private analyzeQuestionForContext(question: string): string[] {
    const lower = question.toLowerCase();
    const neededCollections: string[] = [];

    for (const collection of this.collections) {
      const matches = collection.keywords.some((keyword) =>
        lower.includes(keyword.toLowerCase())
      );
      if (matches) {
        neededCollections.push(collection.name);
      }
    }

    return neededCollections;
  }

  /** Lấy context từ database dựa trên câu hỏi và userId */
  private async getDatabaseContext(
    question: string,
    userId?: string
  ): Promise<DatabaseContext> {
    if (!userId) return {};

    const neededCollections = this.analyzeQuestionForContext(question);
    const context: DatabaseContext = {};

    try {
      const userObjectId = new Types.ObjectId(userId);

      // Lấy dữ liệu từ progressattempts
      if (
        neededCollections.includes("progressattempts") ||
        neededCollections.length === 0
      ) {
        const recentProgress = await ProgressAttempt.find({
          userId: userObjectId,
        })
          .sort({ submittedAt: -1 })
          .limit(5)
          .lean();

        if (recentProgress.length > 0) {
          const totalAttempts = await ProgressAttempt.countDocuments({
            userId: userObjectId,
          });
          const avgAccuracy =
            recentProgress.reduce((sum, p) => sum + (p.acc || 0), 0) /
            recentProgress.length;
          const weakPartsSet = new Set<string>();
          recentProgress.forEach((p) => {
            if (p.weakParts && Array.isArray(p.weakParts)) {
              p.weakParts.forEach((part: string) => weakPartsSet.add(part));
            }
          });

          context.userProgress = {
            recentAttempts: recentProgress.map((p) => ({
              submittedAt: p.submittedAt,
              total: p.total,
              correct: p.correct,
              acc: p.acc,
              listening: p.listening,
              reading: p.reading,
              level: p.level,
              weakParts: p.weakParts || [],
            })),
            stats: {
              totalAttempts,
              averageAccuracy: Math.round(avgAccuracy * 100) / 100,
              weakParts: Array.from(weakPartsSet),
            },
          };
        }
      }

      // Lấy dữ liệu từ practiceattempts
      if (
        neededCollections.includes("practiceattempts") ||
        neededCollections.length === 0
      ) {
        const recentPractices = await PracticeAttempt.find({
          userId: userObjectId,
        })
          .sort({ submittedAt: -1 })
          .limit(10)
          .lean();

        if (recentPractices.length > 0) {
          const partStatsMap: Record<
            string,
            { attempts: number; totalAcc: number }
          > = {};

          recentPractices.forEach((p) => {
            if (!partStatsMap[p.partKey]) {
              partStatsMap[p.partKey] = { attempts: 0, totalAcc: 0 };
            }
            partStatsMap[p.partKey].attempts++;
            partStatsMap[p.partKey].totalAcc += p.acc || 0;
          });

          const partStats: Record<
            string,
            { attempts: number; avgAccuracy: number }
          > = {};
          Object.entries(partStatsMap).forEach(([partKey, stats]) => {
            partStats[partKey] = {
              attempts: stats.attempts,
              avgAccuracy:
                Math.round((stats.totalAcc / stats.attempts) * 100) / 100,
            };
          });

          context.practiceHistory = {
            recentPractices: recentPractices.map((p) => ({
              partKey: p.partKey,
              level: p.level,
              total: p.total,
              correct: p.correct,
              acc: p.acc,
              submittedAt: p.submittedAt,
            })),
            partStats,
          };
        }
      }

      // Lấy dữ liệu từ placementattempts
      if (
        neededCollections.includes("placementattempts") ||
        neededCollections.length === 0
      ) {
        const recentPlacements = await PlacementAttempt.find({
          userId: userObjectId,
        })
          .sort({ submittedAt: -1 })
          .limit(3)
          .lean();

        if (recentPlacements.length > 0) {
          context.placementHistory = {
            recentPlacements: recentPlacements.map((p) => ({
              submittedAt: p.submittedAt,
              level: p.level,
              acc: p.acc,
              predicted: p.predicted,
            })),
            latestLevel: recentPlacements[0]?.level || null,
          };
        }
      }
    } catch (err) {
      console.error("[ChatService] Error loading database context:", err);
    }

    return context;
  }

  /** Format database context thành text để đưa vào prompt */
  private formatDatabaseContext(context: DatabaseContext): string {
    const parts: string[] = [];

    if (context.userProgress) {
      parts.push("## Kết quả Progress Test gần đây");
      if (context.userProgress.recentAttempts.length > 0) {
        parts.push(
          `- Tổng số bài test: ${context.userProgress.stats.totalAttempts}`
        );
        parts.push(
          `- Độ chính xác trung bình: ${context.userProgress.stats.averageAccuracy}%`
        );
        if (context.userProgress.stats.weakParts.length > 0) {
          parts.push(
            `- Phần cần cải thiện: ${context.userProgress.stats.weakParts.join(
              ", "
            )}`
          );
        }
        parts.push("\n**3 bài test gần nhất:**");
        context.userProgress.recentAttempts
          .slice(0, 3)
          .forEach((attempt, idx) => {
            parts.push(
              `${idx + 1}. Ngày ${new Date(
                attempt.submittedAt
              ).toLocaleDateString("vi-VN")}: ${attempt.correct}/${
                attempt.total
              } câu đúng (${attempt.acc}%), Listening: ${
                attempt.listening?.acc || "N/A"
              }%, Reading: ${attempt.reading?.acc || "N/A"}%`
            );
          });
      }
    }

    if (context.practiceHistory) {
      parts.push("\n## Lịch sử Practice");
      if (context.practiceHistory.recentPractices.length > 0) {
        parts.push("**Thống kê theo Part:**");
        Object.entries(context.practiceHistory.partStats).forEach(
          ([partKey, stats]) => {
            parts.push(
              `- ${partKey}: ${stats.attempts} lần, độ chính xác TB: ${stats.avgAccuracy}%`
            );
          }
        );
        parts.push("\n**5 bài practice gần nhất:**");
        context.practiceHistory.recentPractices
          .slice(0, 5)
          .forEach((practice, idx) => {
            parts.push(
              `${idx + 1}. ${practice.partKey} (Level ${practice.level}): ${
                practice.correct
              }/${practice.total} câu đúng (${practice.acc}%)`
            );
          });
      }
    }

    if (context.placementHistory) {
      parts.push("\n## Kết quả Placement Test");
      if (context.placementHistory.latestLevel) {
        parts.push(`- Level hiện tại: ${context.placementHistory.latestLevel}`);
      }
      if (context.placementHistory.recentPlacements.length > 0) {
        parts.push("**Lịch sử placement:**");
        context.placementHistory.recentPlacements.forEach((placement, idx) => {
          parts.push(
            `${idx + 1}. Ngày ${new Date(
              placement.submittedAt
            ).toLocaleDateString("vi-VN")}: Level ${
              placement.level
            }, Accuracy: ${placement.acc}%`
          );
        });
      }
    }

    return parts.length > 0 ? parts.join("\n") : "";
  }

  /** Lấy thông tin user profile từ database */
  private async getUserProfile(
    userId?: string
  ): Promise<UserProfile | undefined> {
    if (!userId) return undefined;

    try {
      const user = await User.findById(userId).lean<IUser>();
      if (!user) return undefined;

      // Tính level từ TOEIC nếu có
      const level = this.calculateLevelFromToeic(user.toeicPred);

      return {
        name: user.name,
        level,
        toeicPred: user.toeicPred || undefined,
        partLevels: user.partLevels || undefined,
        access: user.access,
      };
    } catch (err) {
      console.error("[ChatService] Error loading user profile:", err);
      return undefined;
    }
  }

  /** Gọi một AI provider cụ thể */
  private async callProvider(
    provider: AIProvider,
    messages: Array<{ role: OpenAIRole; content: string }>,
    systemPrompt: { role: "system"; content: string }
  ): Promise<string> {
    const body = {
      model: provider.model,
      messages: [systemPrompt, ...messages],
      max_tokens: 800,
      temperature: 0.7,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const resp = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        let errorText = "";
        try {
          errorText = await resp.text();
        } catch (e) {
          errorText = `Failed to read error response: ${e}`;
        }
        const errorMsg = `${provider.name} API ${
          resp.status
        }: ${errorText.slice(0, 2000)}`;
        console.error(`[ChatService] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      let data;
      try {
        data = await resp.json();
      } catch (e) {
        console.error(
          `[ChatService] ${provider.name} failed to parse JSON response:`,
          e
        );
        throw new Error(`${provider.name} invalid JSON response`);
      }

      if (!data?.choices?.[0]?.message?.content) {
        console.error(
          `[ChatService] ${provider.name} response không có content:`,
          JSON.stringify(data).slice(0, 500)
        );
        throw new Error(`${provider.name} response không có content`);
      }

      let text = data.choices[0].message.content.trim();

      if (!text) {
        throw new Error(`${provider.name} trả về content rỗng`);
      }

      // Loại bỏ các ký tự Trung Quốc nếu có (phòng ngừa)
      // Kiểm tra xem có ký tự Trung Quốc không (Unicode range: \u4e00-\u9fff)
      const chineseRegex = /[\u4e00-\u9fff]+/g;
      if (chineseRegex.test(text)) {
        console.warn(`[ChatService] Phát hiện ký tự Trung Quốc trong response, đang loại bỏ...`);
        // Loại bỏ các đoạn có ký tự Trung Quốc
        text = text.split('\n').filter((line: string) => !chineseRegex.test(line)).join('\n');
        // Nếu sau khi lọc mà text rỗng, thêm thông báo
        if (!text.trim()) {
          text = "Xin lỗi, có lỗi xảy ra khi tạo phản hồi. Vui lòng thử lại.";
        }
      }

      return text;
    } catch (err) {
      clearTimeout(timeoutId);

      // Nếu là timeout
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`${provider.name} request timeout (30s)`);
      }

      // Nếu là network error
      if (
        err instanceof TypeError &&
        (err.message.includes("fetch") || err.message.includes("network"))
      ) {
        throw new Error(`${provider.name} network error: ${err.message}`);
      }

      // Re-throw các lỗi khác
      throw err;
    }
  }

  /** Gọi AI tạo câu trả lời với fallback tự động */
  async generateResponse(
    messages: Partial<IChatMessage>[],
    userId?: string
  ): Promise<string> {
    try {
      const lastMessage =
        messages[messages.length - 1]?.content?.slice(0, 50) || "";
      console.log(
        `[ChatService] generateResponse được gọi với ${
          messages.length
        } messages, userId: ${
          userId || "none"
        }, lastMessage: "${lastMessage}..."`
      );

      // Chặn sớm những câu hỏi ngoài phạm vi
      if (!this.isEnglishRelated(messages)) {
        console.log("[ChatService] Câu hỏi ngoài phạm vi, trả về OUT_OF_SCOPE");
        return ChatService.OUT_OF_SCOPE;
      }

      // Không có provider nào -> trả lỗi
      if (this.providers.length === 0) {
        console.error("[ChatService] Không có providers để gọi!");
        return "Xin lỗi, hệ thống chưa được cấu hình AI provider. Vui lòng liên hệ quản trị viên.";
      }

      // Lấy thông tin user để cá nhân hóa (nếu có userId)
      const userProfile = await this.getUserProfile(userId);

      // Lấy context từ database dựa trên câu hỏi
      const lastQuestion = messages[messages.length - 1]?.content || "";
      const dbContext = await this.getDatabaseContext(lastQuestion, userId);
      const dbContextText = this.formatDatabaseContext(dbContext);

      // Xây dựng system prompt với context từ database
      let systemPrompt = this.buildSystemPrompt(userProfile);
      if (dbContextText) {
        systemPrompt = {
          role: "system",
          content: `${systemPrompt.content}\n\n## Dữ liệu từ hệ thống\n${dbContextText}\n\n**Lưu ý**: Sử dụng thông tin trên để đưa ra câu trả lời chính xác và cá nhân hóa dựa trên lịch sử học tập của người dùng.`,
        };
      }

      // Chuẩn hóa messages (mặc định role lạ -> 'user')
      const normalizedMessages = messages
        .filter((m) => m?.content)
        .map((m) => {
          const role = (String(m.role) as OpenAIRole) || "user";
          const safeRole: OpenAIRole =
            role === "assistant" || role === "user" ? role : "user";
          return { role: safeRole, content: String(m.content) };
        });

      // Thử từng provider theo thứ tự, nếu fail thì chuyển sang provider tiếp theo
      let lastError: Error | null = null;

      for (let i = 0; i < this.providers.length; i++) {
        const provider = this.providers[i];

        try {
          console.log(
            `[ChatService] Đang thử provider: ${provider.name} (${i + 1}/${
              this.providers.length
            })`
          );

          const response = await this.callProvider(
            provider,
            normalizedMessages,
            systemPrompt
          );

          // Nếu thành công và không phải provider đầu tiên, log để theo dõi
          if (i > 0) {
            console.log(
              `[ChatService] Fallback thành công: ${provider.name} đã thay thế ${this.providers[0].name}`
            );
          }

          return response;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          lastError = error;

          console.error(
            `[ChatService] Provider ${provider.name} thất bại:`,
            error.message
          );

          // Nếu không phải provider cuối cùng, tiếp tục thử provider tiếp theo
          if (i < this.providers.length - 1) {
            console.log(`[ChatService] Chuyển sang provider dự phòng...`);
            continue;
          }
        }
      }

      // Tất cả providers đều fail
      if (lastError) {
        console.error(
          "[ChatService] Tất cả providers đều thất bại. Lỗi cuối cùng:",
          {
            message: lastError.message,
            stack: lastError.stack,
          }
        );

        // Trả về message lỗi cụ thể hơn
        const errorMsg = lastError.message || "Unknown error";
        if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
          return "Xin lỗi, API key không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ quản trị viên.";
        } else if (
          errorMsg.includes("429") ||
          errorMsg.includes("rate limit")
        ) {
          return "Xin lỗi, đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau vài phút.";
        } else if (errorMsg.includes("timeout")) {
          return "Xin lỗi, yêu cầu đã quá thời gian chờ (30s). Vui lòng thử lại sau.";
        } else if (errorMsg.includes("network")) {
          return "Xin lỗi, không thể kết nối đến AI service. Vui lòng kiểm tra kết nối mạng và thử lại.";
        }
        return `Xin lỗi, đã xảy ra lỗi khi tạo phản hồi: ${errorMsg}. Vui lòng thử lại sau.`;
      } else {
        console.error(
          "[ChatService] Không có providers nào được cấu hình hoặc tất cả đều fail mà không có error"
        );
        return "Xin lỗi, hệ thống AI chưa được cấu hình. Vui lòng liên hệ quản trị viên.";
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[ChatService] generateResponse unexpected error:", {
        message: error.message,
        stack: error.stack,
      });
      return `Xin lỗi, đã xảy ra lỗi không mong đợi: ${error.message}. Vui lòng thử lại sau.`;
    }
  }

  /**
   * Tạo Learning Insight tự động sau khi nộp bài test
   * @param userId - ID người dùng
   * @param testType - Loại test: "placement" | "practice" | "progress"
   * @param attemptId - ID của attempt vừa nộp
   * @param sessionId - Session ID của chat (mặc định: "default")
   */
  async generateLearningInsight(
    userId: string,
    testType: "placement" | "practice" | "progress",
    attemptId: string,
    sessionId: string = "default"
  ): Promise<void> {
    try {
      console.log(
        `[ChatService] Generating Learning Insight for userId: ${userId}, testType: ${testType}, attemptId: ${attemptId}`
      );

      // Lấy thông tin user
      const user = await User.findById(userId).lean<IUser>();
      if (!user) {
        console.error(`[ChatService] User not found: ${userId}`);
        return;
      }

      // CHỈ gửi Learning Insight cho user premium
      if (user.access !== "premium") {
        console.log(
          `[ChatService] Skipping Learning Insight for free user: ${userId}`
        );
        return;
      }

      // Lấy attempt vừa nộp
      let currentAttempt: any = null;
      const attemptObjectId = new Types.ObjectId(attemptId);

      if (testType === "progress") {
        currentAttempt = await ProgressAttempt.findById(attemptObjectId).lean();
      } else if (testType === "practice") {
        currentAttempt = await PracticeAttempt.findById(attemptObjectId).lean();
      } else if (testType === "placement") {
        currentAttempt = await PlacementAttempt.findById(
          attemptObjectId
        ).lean();
      }

      if (!currentAttempt) {
        console.error(`[ChatService] Attempt not found: ${attemptId}`);
        return;
      }

      // Lấy attempt trước đó để so sánh
      let previousAttempt: any = null;
      const userObjectId = new Types.ObjectId(userId);

      if (testType === "progress") {
        const previousAttempts = await ProgressAttempt.find({
          userId: userObjectId,
          _id: { $ne: attemptObjectId },
        })
          .sort({ submittedAt: -1 })
          .limit(1)
          .lean();
        previousAttempt = previousAttempts[0] || null;
      } else if (testType === "practice") {
        const previousAttempts = await PracticeAttempt.find({
          userId: userObjectId,
          partKey: currentAttempt.partKey,
          _id: { $ne: attemptObjectId },
        })
          .sort({ submittedAt: -1 })
          .limit(1)
          .lean();
        previousAttempt = previousAttempts[0] || null;
      } else if (testType === "placement") {
        // Placement chỉ làm 1 lần nên không có previous
        previousAttempt = null;
      }

      // Lấy mục tiêu TOEIC
      const toeicGoal = user.toeicGoal;
      const currentScore = user.toeicPred?.overall ?? null;

      // Tính progress nếu có mục tiêu
      let progressPercent = null;
      if (
        toeicGoal &&
        toeicGoal.targetScore !== null &&
        toeicGoal.startScore !== null &&
        currentScore !== null
      ) {
        const diff = toeicGoal.targetScore - toeicGoal.startScore;
        if (diff > 0) {
          progressPercent = Math.min(
            100,
            Math.max(0, ((currentScore - toeicGoal.startScore) / diff) * 100)
          );
        }
      }

      // Lấy activity data (heatmap) - 30 ngày gần nhất
      const [practiceAttempts, progressAttempts, placementAttempts] =
        await Promise.all([
          PracticeAttempt.find({ userId: userObjectId })
            .select("submittedAt createdAt")
            .lean(),
          ProgressAttempt.find({ userId: userObjectId })
            .select("submittedAt createdAt")
            .lean(),
          PlacementAttempt.find({ userId: userObjectId })
            .select("submittedAt createdAt")
            .lean(),
        ]);

      const allAttempts: Array<{ date: Date }> = [
        ...practiceAttempts.map((a) => ({
          date: new Date(a.submittedAt || (a as any).createdAt || Date.now()),
        })),
        ...progressAttempts.map((a) => ({
          date: new Date(a.submittedAt || (a as any).createdAt || Date.now()),
        })),
        ...placementAttempts.map((a) => ({
          date: new Date(a.submittedAt || (a as any).createdAt || Date.now()),
        })),
      ];

      // Nhóm theo ngày (30 ngày gần nhất)
      const activityMap = new Map<string, number>();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const attempt of allAttempts) {
        if (attempt.date >= thirtyDaysAgo) {
          const dateStr = attempt.date.toISOString().split("T")[0];
          activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
        }
      }

      const activityData = Array.from(activityMap.entries()).map(
        ([date, count]) => ({
          date,
          count,
        })
      );

      const totalActivityDays = activityData.filter((d) => d.count > 0).length;
      const totalActivityAttempts = activityData.reduce(
        (sum, d) => sum + d.count,
        0
      );

      // Xây dựng prompt cho AI
      const insightPrompt = this.buildInsightPrompt(
        testType,
        currentAttempt,
        previousAttempt,
        toeicGoal,
        currentScore,
        progressPercent,
        totalActivityDays,
        totalActivityAttempts,
        user.name
      );

      // Gọi AI để tạo insight
      const userProfile = await this.getUserProfile(userId);
      const systemPrompt = this.buildSystemPrompt(userProfile);

      const messages: Array<{ role: OpenAIRole; content: string }> = [
        { role: "user", content: insightPrompt },
      ];

      let insightText = "";
      let lastError: Error | null = null;

      for (let i = 0; i < this.providers.length; i++) {
        const provider = this.providers[i];
        try {
          insightText = await this.callProvider(
            provider,
            messages,
            systemPrompt
          );
          break;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          lastError = error;
          if (i < this.providers.length - 1) {
            continue;
          }
        }
      }

      if (!insightText && lastError) {
        console.error(
          `[ChatService] Failed to generate insight: ${lastError.message}`
        );
        return;
      }

      // Lưu insight vào chat
      const insightMessage = new ChatMessage({
        userId,
        role: "assistant",
        content: insightText,
        sessionId,
      });
      await insightMessage.save();

      console.log(
        `[ChatService] Learning Insight saved to chat for userId: ${userId}`
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`[ChatService] Error generating Learning Insight:`, {
        message: error.message,
        stack: error.stack,
      });
    }
  }

  /** Xây dựng prompt cho Learning Insight */
  private buildInsightPrompt(
    testType: "placement" | "practice" | "progress",
    currentAttempt: any,
    previousAttempt: any | null,
    toeicGoal: any | null,
    currentScore: number | null,
    progressPercent: number | null,
    totalActivityDays: number,
    totalActivityAttempts: number,
    userName: string
  ): string {
    const parts: string[] = [];

    parts.push(
      `Bạn là trợ lý học tập chuyên nghiệp. Hãy phân tích kết quả bài test vừa nộp và đưa ra nhận xét cá nhân hóa cho ${userName}.`
    );

    // Thông tin bài test hiện tại
    if (testType === "progress") {
      parts.push(`\n## Kết quả Progress Test vừa nộp`);
      parts.push(`- Tổng số câu: ${currentAttempt.total}`);
      parts.push(`- Số câu đúng: ${currentAttempt.correct}`);
      parts.push(`- Độ chính xác: ${(currentAttempt.acc * 100).toFixed(1)}%`);
      parts.push(
        `- Listening: ${currentAttempt.listening?.correct || 0}/${
          currentAttempt.listening?.total || 0
        } (${((currentAttempt.listening?.acc || 0) * 100).toFixed(1)}%)`
      );
      parts.push(
        `- Reading: ${currentAttempt.reading?.correct || 0}/${
          currentAttempt.reading?.total || 0
        } (${((currentAttempt.reading?.acc || 0) * 100).toFixed(1)}%)`
      );
      if (currentAttempt.predicted) {
        parts.push(
          `- Điểm TOEIC dự đoán: Tổng ${
            currentAttempt.predicted.overall || "N/A"
          }, Listening ${
            currentAttempt.predicted.listening || "N/A"
          }, Reading ${currentAttempt.predicted.reading || "N/A"}`
        );
      }
      if (currentAttempt.weakParts && currentAttempt.weakParts.length > 0) {
        parts.push(
          `- Phần cần cải thiện: ${currentAttempt.weakParts.join(", ")}`
        );
      }
      if (currentAttempt.partStats) {
        parts.push(`\n**Chi tiết theo Part:**`);
        const partStatsArray = Object.entries(currentAttempt.partStats)
          .map(([part, stats]: [string, any]) => ({
            part,
            ...stats,
            accuracy: (stats.acc || 0) * 100
          }))
          .sort((a, b) => a.accuracy - b.accuracy); // Sắp xếp từ yếu đến mạnh
        
        partStatsArray.forEach(({ part, correct, total, accuracy }) => {
          parts.push(
            `- ${part}: ${correct || 0}/${total || 0} (${accuracy.toFixed(1)}%)`
          );
        });
        
        // Phân tích pattern lỗi lặp lại
        if (currentAttempt.items && Array.isArray(currentAttempt.items)) {
          const incorrectItems = currentAttempt.items.filter((item: any) => !item.isCorrect);
          if (incorrectItems.length > 0) {
            const partErrorCount = new Map<string, number>();
            incorrectItems.forEach((item: any) => {
              const part = item.part || "unknown";
              partErrorCount.set(part, (partErrorCount.get(part) || 0) + 1);
            });
            
            const topErrorParts = Array.from(partErrorCount.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3);
            
            if (topErrorParts.length > 0) {
              parts.push(`\n**Các Part có nhiều lỗi nhất:**`);
              topErrorParts.forEach(([part, count]) => {
                parts.push(`- ${part}: ${count} câu sai`);
              });
            }
          }
        }
      }
    } else if (testType === "practice") {
      parts.push(`\n## Kết quả Practice Test vừa nộp`);
      parts.push(`- Part: ${currentAttempt.partKey}`);
      parts.push(`- Level: ${currentAttempt.level}`);
      parts.push(
        `- Số câu đúng: ${currentAttempt.correct}/${currentAttempt.total}`
      );
      parts.push(`- Độ chính xác: ${(currentAttempt.acc * 100).toFixed(1)}%`);
      
      // Gom nhóm các câu hỏi theo tag và trạng thái để phân tích tổng quát
      if (currentAttempt.answersMap && currentAttempt.userAnswers) {
        const questionList: Array<{
          questionNumber: number;
          isCorrect: boolean;
          userAnswer: string | null;
          correctAnswer: string;
          tags: string[];
          explain?: string;
        }> = [];
        
        // Sắp xếp theo thứ tự
        const sortedEntries = Object.entries(currentAttempt.answersMap).sort(([a], [b]) => {
          const numA = a.match(/\d+/)?.[0];
          const numB = b.match(/\d+/)?.[0];
          if (numA && numB) {
            return parseInt(numA, 10) - parseInt(numB, 10);
          }
          return a.localeCompare(b);
        });
        
        for (let idx = 0; idx < sortedEntries.length; idx++) {
          const [itemId, answerData] = sortedEntries[idx];
          const answerDataTyped = answerData as { correctAnswer: string; tags?: string[]; explain?: string };
          const userAnswer = currentAttempt.userAnswers[itemId] || null;
          const isCorrect = userAnswer === answerDataTyped.correctAnswer;
          const tags = answerDataTyped.tags || [];
          
          questionList.push({
            questionNumber: idx + 1,
            isCorrect,
            userAnswer,
            correctAnswer: answerDataTyped.correctAnswer,
            tags,
            explain: answerDataTyped.explain,
          });
        }
        
        // Gom nhóm câu sai theo tag
        const incorrectByTag = new Map<string, Array<typeof questionList[0]>>();
        const incorrectNoTag: Array<typeof questionList[0]> = [];
        
        // Gom nhóm câu đúng theo tag
        const correctByTag = new Map<string, Array<typeof questionList[0]>>();
        const correctNoTag: Array<typeof questionList[0]> = [];
        
        for (const q of questionList) {
          if (q.isCorrect) {
            if (q.tags.length > 0) {
              for (const tag of q.tags) {
                if (!correctByTag.has(tag)) {
                  correctByTag.set(tag, []);
                }
                correctByTag.get(tag)!.push(q);
              }
            } else {
              correctNoTag.push(q);
            }
          } else {
            if (q.tags.length > 0) {
              for (const tag of q.tags) {
                if (!incorrectByTag.has(tag)) {
                  incorrectByTag.set(tag, []);
                }
                incorrectByTag.get(tag)!.push(q);
              }
            } else {
              incorrectNoTag.push(q);
            }
          }
        }
        
        // Thêm thông tin nhóm vào prompt - liệt kê TOÀN BỘ các câu trong mỗi nhóm
        parts.push(`\n**Dữ liệu chi tiết các nhóm câu hỏi:**`);
        
        // Tính phần trăm theo từng tag để phân tích ưu tiên
        const tagStats = new Map<string, { total: number; correct: number; incorrect: number; accuracy: number }>();
        
        // Nhóm câu sai - liệt kê TOÀN BỘ
        if (incorrectByTag.size > 0 || incorrectNoTag.length > 0) {
          parts.push(`\n**Các nhóm câu sai:**`);
          
          // Sắp xếp theo số lượng câu sai giảm dần
          const incorrectTagArray = Array.from(incorrectByTag.entries())
            .map(([tag, questions]) => ({ tag, count: questions.length, questions }))
            .sort((a, b) => b.count - a.count);
          
          for (const { tag, count, questions } of incorrectTagArray) {
            // Liệt kê TẤT CẢ các câu trong nhóm
            const allQuestionNumbers = questions.map(q => q.questionNumber).sort((a, b) => a - b);
            const questionNumbersText = allQuestionNumbers.join(", ");
            
            // Thu thập thông tin đáp án và giải thích
            const answerPatterns: string[] = [];
            const explains: string[] = [];
            questions.forEach(q => {
              const answerInfo = q.userAnswer 
                ? `chọn ${q.userAnswer} (đúng: ${q.correctAnswer})`
                : `không chọn (đúng: ${q.correctAnswer})`;
              answerPatterns.push(`Câu ${q.questionNumber}: ${answerInfo}`);
              if (q.explain) explains.push(q.explain);
            });
            
            parts.push(`- **${tag}**: ${count} câu sai - các câu: ${questionNumbersText}`);
            parts.push(`  Chi tiết: ${answerPatterns.join(" | ")}`);
            if (explains.length > 0) {
              parts.push(`  Giải thích chuẩn (tham khảo): ${explains.slice(0, 3).join(" | ")}`);
            }
            
            // Cập nhật thống kê tag (nếu chưa có)
            if (!tagStats.has(tag)) {
              const totalForTag = questionList.filter(q => q.tags.includes(tag)).length;
              const correctForTag = questionList.filter(q => q.tags.includes(tag) && q.isCorrect).length;
              tagStats.set(tag, {
                total: totalForTag,
                correct: correctForTag,
                incorrect: totalForTag - correctForTag,
                accuracy: totalForTag > 0 ? (correctForTag / totalForTag) * 100 : 0
              });
            }
          }
          
          if (incorrectNoTag.length > 0) {
            const allQuestionNumbers = incorrectNoTag.map(q => q.questionNumber).sort((a, b) => a - b);
            const questionNumbersText = allQuestionNumbers.join(", ");
            const answerPatterns = incorrectNoTag.map(q => {
              const answerInfo = q.userAnswer 
                ? `chọn ${q.userAnswer} (đúng: ${q.correctAnswer})`
                : `không chọn (đúng: ${q.correctAnswer})`;
              return `Câu ${q.questionNumber}: ${answerInfo}`;
            });
            parts.push(`- **Không có tag**: ${incorrectNoTag.length} câu sai - các câu: ${questionNumbersText}`);
            parts.push(`  Chi tiết: ${answerPatterns.join(" | ")}`);
          }
        }
        
        // Nhóm câu đúng - liệt kê TOÀN BỘ
        if (correctByTag.size > 0 || correctNoTag.length > 0) {
          parts.push(`\n**Các nhóm câu đúng:**`);
          
          // Sắp xếp theo số lượng câu đúng giảm dần
          const correctTagArray = Array.from(correctByTag.entries())
            .map(([tag, questions]) => ({ tag, count: questions.length, questions }))
            .sort((a, b) => b.count - a.count);
          
          for (const { tag, count, questions } of correctTagArray) {
            // Liệt kê TẤT CẢ các câu trong nhóm
            const allQuestionNumbers = questions.map(q => q.questionNumber).sort((a, b) => a - b);
            const questionNumbersText = allQuestionNumbers.join(", ");
            
            const explains = questions.filter(q => q.explain).map(q => q.explain).slice(0, 3);
            
            parts.push(`- **${tag}**: ${count} câu đúng - các câu: ${questionNumbersText}`);
            if (explains.length > 0) {
              parts.push(`  Giải thích chuẩn (tham khảo): ${explains.join(" | ")}`);
            }
            
            // Cập nhật thống kê tag (nếu chưa có)
            if (!tagStats.has(tag)) {
              const totalForTag = questionList.filter(q => q.tags.includes(tag)).length;
              const correctForTag = count;
              tagStats.set(tag, {
                total: totalForTag,
                correct: correctForTag,
                incorrect: totalForTag - correctForTag,
                accuracy: totalForTag > 0 ? (correctForTag / totalForTag) * 100 : 0
              });
            }
          }
          
          if (correctNoTag.length > 0) {
            const allQuestionNumbers = correctNoTag.map(q => q.questionNumber).sort((a, b) => a - b);
            const questionNumbersText = allQuestionNumbers.join(", ");
            parts.push(`- **Không có tag**: ${correctNoTag.length} câu đúng - các câu: ${questionNumbersText}`);
          }
        }
        
        // Phân tích ưu tiên - tìm dạng yếu nhất và mạnh nhất
        if (tagStats.size > 0) {
          parts.push(`\n**Phân tích phần trăm theo từng dạng (để chỉ ra dạng yếu nhất/mạnh nhất):**`);
          const tagArray = Array.from(tagStats.entries())
            .map(([tag, stats]) => ({ tag, ...stats }))
            .sort((a, b) => a.accuracy - b.accuracy); // Sắp xếp từ yếu đến mạnh
          
          tagArray.forEach(({ tag, total, correct, incorrect, accuracy }) => {
            parts.push(`- **${tag}**: ${correct}/${total} đúng (${accuracy.toFixed(1)}%)`);
          });
          
          // Chỉ ra dạng yếu nhất (1-2 dạng)
          const weakest = tagArray.slice(0, Math.min(2, tagArray.length));
          if (weakest.length > 0) {
            parts.push(`\n**Dạng yếu nhất:** ${weakest.map(w => w.tag).join(", ")}`);
          }
          
          // Chỉ ra dạng mạnh nhất (1 dạng)
          const strongest = tagArray.slice(-1);
          if (strongest.length > 0 && strongest[0].accuracy > 0) {
            parts.push(`**Dạng mạnh nhất:** ${strongest[0].tag}`);
          }
        }
      }
    } else if (testType === "placement") {
      parts.push(`\n## Kết quả Placement Test vừa nộp`);
      parts.push(`- Tổng số câu: ${currentAttempt.total}`);
      parts.push(`- Số câu đúng: ${currentAttempt.correct}`);
      parts.push(`- Độ chính xác: ${(currentAttempt.acc * 100).toFixed(1)}%`);
      parts.push(
        `- Listening: ${currentAttempt.listening?.correct || 0}/${
          currentAttempt.listening?.total || 0
        } (${((currentAttempt.listening?.acc || 0) * 100).toFixed(1)}%)`
      );
      parts.push(
        `- Reading: ${currentAttempt.reading?.correct || 0}/${
          currentAttempt.reading?.total || 0
        } (${((currentAttempt.reading?.acc || 0) * 100).toFixed(1)}%)`
      );
      parts.push(`- Level được xác định: ${currentAttempt.level}`);
      if (currentAttempt.predicted) {
        parts.push(
          `- Điểm TOEIC dự đoán: Tổng ${
            currentAttempt.predicted.overall || "N/A"
          }, Listening ${
            currentAttempt.predicted.listening || "N/A"
          }, Reading ${currentAttempt.predicted.reading || "N/A"}`
        );
      }
      if (currentAttempt.weakParts && currentAttempt.weakParts.length > 0) {
        parts.push(
          `- Phần cần cải thiện: ${currentAttempt.weakParts.join(", ")}`
        );
      }
      
      // Phân tích chi tiết theo Part cho Placement
      if (currentAttempt.partStats) {
        parts.push(`\n**Chi tiết theo Part:**`);
        const partStatsArray = Object.entries(currentAttempt.partStats)
          .map(([part, stats]: [string, any]) => ({
            part,
            ...stats,
            accuracy: (stats.acc || 0) * 100
          }))
          .sort((a, b) => a.accuracy - b.accuracy); // Sắp xếp từ yếu đến mạnh
        
        partStatsArray.forEach(({ part, correct, total, accuracy }) => {
          parts.push(
            `- ${part}: ${correct || 0}/${total || 0} (${accuracy.toFixed(1)}%)`
          );
        });
        
        // Phân tích pattern lỗi lặp lại
        if (currentAttempt.items && Array.isArray(currentAttempt.items)) {
          const incorrectItems = currentAttempt.items.filter((item: any) => !item.isCorrect);
          if (incorrectItems.length > 0) {
            const partErrorCount = new Map<string, number>();
            incorrectItems.forEach((item: any) => {
              const part = item.part || "unknown";
              partErrorCount.set(part, (partErrorCount.get(part) || 0) + 1);
            });
            
            const topErrorParts = Array.from(partErrorCount.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3);
            
            if (topErrorParts.length > 0) {
              parts.push(`\n**Các Part có nhiều lỗi nhất:**`);
              topErrorParts.forEach(([part, count]) => {
                parts.push(`- ${part}: ${count} câu sai`);
              });
            }
          }
        }
      }
      
      // Phân tích theo mức độ khó (level)
      parts.push(`\n**Phân tích theo mức độ khó:**`);
      parts.push(`- Level được xác định: ${currentAttempt.level}`);
      if (currentAttempt.level === 1) {
        parts.push(`- Đây là level cơ bản. Nếu độ chính xác thấp, cần củng cố nền tảng.`);
      } else if (currentAttempt.level === 2) {
        parts.push(`- Đây là level trung bình. Cần cân bằng giữa củng cố và nâng cao.`);
      } else {
        parts.push(`- Đây là level nâng cao. Cần tập trung vào các điểm khó và tinh chỉnh kỹ năng.`);
      }
    }

    // So sánh với bài trước
    if (previousAttempt) {
      parts.push(`\n## So sánh với bài trước`);
      if (testType === "progress") {
        const accChange = (currentAttempt.acc - previousAttempt.acc) * 100;
        parts.push(
          `- Độ chính xác: ${(previousAttempt.acc * 100).toFixed(1)}% → ${(
            currentAttempt.acc * 100
          ).toFixed(1)}% (${accChange >= 0 ? "+" : ""}${accChange.toFixed(1)}%)`
        );
        if (previousAttempt.predicted && currentAttempt.predicted) {
          const scoreChange =
            (currentAttempt.predicted.overall || 0) -
            (previousAttempt.predicted.overall || 0);
          if (scoreChange !== 0) {
            parts.push(
              `- Điểm TOEIC: ${previousAttempt.predicted.overall || "N/A"} → ${
                currentAttempt.predicted.overall || "N/A"
              } (${scoreChange >= 0 ? "+" : ""}${scoreChange} điểm)`
            );
          }
        }
      } else if (testType === "practice") {
        const accChange = (currentAttempt.acc - previousAttempt.acc) * 100;
        parts.push(
          `- Độ chính xác: ${(previousAttempt.acc * 100).toFixed(1)}% → ${(
            currentAttempt.acc * 100
          ).toFixed(1)}% (${accChange >= 0 ? "+" : ""}${accChange.toFixed(1)}%)`
        );
      }
    }

    // Mục tiêu TOEIC và progress
    if (toeicGoal && toeicGoal.targetScore !== null) {
      parts.push(`\n## Mục tiêu TOEIC`);
      parts.push(`- Điểm khởi đầu: ${toeicGoal.startScore || "N/A"}`);
      parts.push(`- Điểm mục tiêu: ${toeicGoal.targetScore}`);
      parts.push(`- Điểm hiện tại: ${currentScore || "Chưa có"}`);
      if (progressPercent !== null) {
        parts.push(`- Tiến độ: ${progressPercent.toFixed(1)}%`);
        parts.push(
          `\n**Thanh tiến độ:** [${"█".repeat(
            Math.floor(progressPercent / 5)
          )}${"░".repeat(
            20 - Math.floor(progressPercent / 5)
          )}] ${progressPercent.toFixed(1)}%`
        );
      }
    }

    // Activity heatmap
    if (totalActivityAttempts > 0) {
      parts.push(`\n## Hoạt động học tập (30 ngày gần nhất)`);
      parts.push(`- Số ngày có hoạt động: ${totalActivityDays} ngày`);
      parts.push(`- Tổng số bài đã làm: ${totalActivityAttempts} bài`);
    }

    // Yêu cầu AI - Phân tích theo từng loại test
    parts.push(`\n## Yêu cầu phân tích`);
    
    if (testType === "practice") {
      // Practice test - Phân tích theo cấu trúc mới: tóm tắt → nhóm lỗi → nhóm mạnh → gợi ý cải thiện
      parts.push(`Bạn là AI Insight trong hệ thống luyện TOEIC. Hãy tạo bài nhận xét theo cấu trúc sau, văn phong thân thiện – dễ hiểu – không khô khan – không giáo điều:`);
      
      parts.push(`\n### (1) Tóm tắt:`);
      parts.push(`- Một đoạn ngắn 3–4 câu.`);
      parts.push(`- Ghi tổng số câu, số câu đúng, % chính xác.`);
      parts.push(`- Nếu có dữ liệu lần trước, hãy so sánh mức độ tiến bộ/giảm sút (± bao nhiêu %).`);
      parts.push(`- KHÔNG phân tích nguyên nhân chi tiết ở phần này.`);
      
      parts.push(`\n### (2) Nhóm lỗi điển hình:`);
      parts.push(`- Gom các câu sai thành 2–4 nhóm theo điểm chung (ví dụ: đọc hiểu đoạn đơn, suy luận, tìm thông tin chi tiết, mục đích tác giả, email/letter, instructions…).`);
      parts.push(`- KHÔNG dùng ID như "p7_001", chỉ dùng số câu: "câu 5", "câu 18", "câu 27".`);
      parts.push(`- THAY ĐỔI: KHÔNG chỉ chọn 2–4 câu tiêu biểu nữa. Hãy liệt kê TOÀN BỘ các câu thuộc nhóm lỗi đó, nhưng gom lại để giải thích lỗi theo pattern chung, KHÔNG phân tích từng câu một.`);
      parts.push(`- Với từng nhóm, hãy mô tả:`);
      parts.push(`  * Học viên đã hiểu sai chỗ nào?`);
      parts.push(`  * Sai vì chọn từ khóa trùng? Bỏ sót ý? Không suy luận?`);
      parts.push(`  * Nếu tag tồn tại, hãy diễn giải bằng ngôn ngữ tự nhiên (quảng cáo, thông báo, email công việc…).`);
      parts.push(`- Khi có pattern lặp lại, hãy gom lại dạng: "Ở các câu 6, 12, 20, 22 và 31, bạn đều chọn đáp án chứa từ khóa giống đoạn văn nhưng không đúng ngữ cảnh."`);
      parts.push(`- KHÔNG phân tích dài từng câu, chỉ giải thích theo pattern chung của nhóm.`);
      
      parts.push(`\n### (3) Nhóm điểm mạnh:`);
      parts.push(`- Chọn 2–3 kỹ năng hoặc dạng bài mà học viên làm tốt nhất.`);
      parts.push(`- Liệt kê TẤT CẢ các câu đúng thuộc nhóm mạnh đó, nhưng chỉ phân tích theo nhóm – KHÔNG giải thích từng câu.`);
      parts.push(`- Giải thích học viên làm tốt điều gì:`);
      parts.push(`  * bắt được main idea`);
      parts.push(`  * suy luận tốt`);
      parts.push(`  * chọn đúng key info`);
      parts.push(`  * hiểu được tone/purpose`);
      parts.push(`- Văn phong tích cực – KHÔNG tâng bốc quá mức.`);
      
      parts.push(`\n### (4) Gợi ý cải thiện có thể hành động ngay:`);
      parts.push(`- KHÔNG chung chung kiểu "bạn cần cố gắng hơn".`);
      parts.push(`- Gợi ý theo dạng hướng dẫn cụ thể:`);
      parts.push(`  * số câu nên luyện/ngày`);
      parts.push(`  * dạng bài nên ưu tiên`);
      parts.push(`  * kỹ năng nên tập trung (suy luận, scanning, tìm keyword, đọc mở đầu–kết thúc…)`);
      parts.push(`  * phương pháp học: ghi chú keyword, luyện paraphrase, luyện inference…`);
      parts.push(`- Ngắn gọn nhưng thực tế và làm được liền.`);
      
      parts.push(`\n**YÊU CẦU CHUNG:**`);
      parts.push(`- KHÔNG giải thích dài dòng từng câu.`);
      parts.push(`- KHÔNG nhắc lại tag kỹ thuật như "tag: p7_advertisement".`);
      parts.push(`- KHÔNG lặp ý giữa các phần.`);
      parts.push(`- KHÔNG phán xét tiêu cực.`);
      parts.push(`- Output dài khoảng 6–10 đoạn, mạch lạc, rõ ràng.`);
      
      parts.push(`\n**(Optional) PHÂN TÍCH ƯU TIÊN:**`);
      parts.push(`- Nếu dữ liệu có phần trăm theo từng dạng, hãy tự động chỉ ra:`);
      parts.push(`  * 1–2 dạng yếu nhất`);
      parts.push(`  * 1 dạng mạnh nhất`);
      parts.push(`- Vẫn diễn giải bằng ngôn ngữ tự nhiên, KHÔNG dùng tag kỹ thuật.`);
      
    } else if (testType === "placement" || testType === "progress") {
      // Placement và Progress test - Phân tích theo kỹ năng, part, level
      parts.push(`Đưa ra phân tích chuyên sâu bao gồm:`);
      
      parts.push(`\n### 1. Phân tích theo Kỹ năng (Listening vs Reading):`);
      parts.push(`- So sánh chi tiết độ chính xác giữa Listening và Reading.`);
      parts.push(`- Xác định kỹ năng nào mạnh hơn và kỹ năng nào cần cải thiện.`);
      parts.push(`- Phân tích nguyên nhân: Tại sao một kỹ năng tốt hơn kỹ năng kia? (ví dụ: vốn từ vựng tốt nhưng kỹ năng nghe chưa đủ, hoặc ngược lại).`);
      
      parts.push(`\n### 2. Phân tích theo Part:`);
      parts.push(`- Dựa trên thống kê chi tiết theo Part ở trên, phân tích:`);
      parts.push(`  * Part nào làm tốt nhất và tại sao.`);
      parts.push(`  * Part nào yếu nhất và nguyên nhân cụ thể.`);
      parts.push(`  * Pattern lỗi lặp lại: Có Part nào người dùng thường xuyên sai không?`);
      parts.push(`  * Mối liên hệ giữa các Part (ví dụ: Part 5 yếu có thể ảnh hưởng đến Part 6).`);
      
      parts.push(`\n### 3. Phân tích theo Mức độ khó (Level):`);
      parts.push(`- Đánh giá khả năng của người dùng ở level hiện tại.`);
      parts.push(`- Nếu level thấp (1): Cần củng cố nền tảng nào?`);
      parts.push(`- Nếu level trung bình (2): Cần cân bằng giữa củng cố và nâng cao như thế nào?`);
      parts.push(`- Nếu level cao (3): Cần tập trung vào điểm nào để đạt điểm tối đa?`);
      
      parts.push(`\n### 4. Phân tích Pattern lỗi lặp lại:`);
      parts.push(`- Xác định các lỗi thường xuyên xuất hiện (dựa trên danh sách các Part có nhiều lỗi nhất).`);
      parts.push(`- Phân tích nguyên nhân: Tại sao người dùng lại sai ở những Part đó?`);
      parts.push(`- Chỉ ra mối liên hệ giữa các lỗi (ví dụ: yếu ngữ pháp sẽ ảnh hưởng đến nhiều Part).`);
      
      parts.push(`\n### 5. Gợi ý cải thiện cụ thể:`);
      parts.push(`- Đưa ra 3-5 gợi ý cải thiện cụ thể, ưu tiên:`);
      parts.push(`  * Các Part yếu nhất (độ chính xác thấp nhất).`);
      parts.push(`  * Kỹ năng yếu hơn (Listening hoặc Reading).`);
      parts.push(`  * Các lỗi lặp lại nhiều nhất.`);
      parts.push(`- Mỗi gợi ý phải có hành động cụ thể (ví dụ: "Luyện Part 5 mỗi ngày 30 phút", "Học 20 từ vựng mới mỗi ngày", v.v.).`);
      
      parts.push(`\n### 6. So sánh tiến bộ:`);
      parts.push(previousAttempt
        ? `- So sánh với bài ${testType === "placement" ? "placement" : "progress"} trước: Có cải thiện về Part nào, kỹ năng nào không?`
        : `- Đây là bài ${testType === "placement" ? "placement" : "progress"} đầu tiên. Đánh giá tổng quan điểm mạnh và điểm yếu.`);
      
      parts.push(`\n### 7. Động viên:`);
      parts.push(`- Lời động viên phù hợp với kết quả, nhấn mạnh vào những Part/kỹ năng đã làm tốt.`);
      
      if (progressPercent !== null) {
        parts.push(`\n### 8. Tiến độ mục tiêu TOEIC:`);
        parts.push(`- Nhận xét về tiến độ đạt mục tiêu TOEIC dựa trên điểm dự đoán hiện tại.`);
        parts.push(`- Lời khuyên để đạt mục tiêu dựa trên phân tích điểm mạnh và điểm yếu.`);
      }
    }

    parts.push(`\n**Lưu ý:**`);
    parts.push(`- Ngôn ngữ thân thiện, động viên, chuyên nghiệp`);
    parts.push(`- Phân tích sâu, chi tiết, có căn cứ từ dữ liệu`);
    parts.push(`- Gợi ý cụ thể, có thể thực hiện ngay`);
    parts.push(`- Dùng Markdown hợp lý (headings, lists, bold, v.v.)`);
    parts.push(`- Không dùng emoji`);
    if (testType === "practice") {
      parts.push(`- Độ dài 500-800 từ (phân tích sâu hơn vì có tag)`);
    } else {
      parts.push(`- Độ dài 400-600 từ`);
    }

    return parts.join("\n");
  }
}

export const chatService = new ChatService();
