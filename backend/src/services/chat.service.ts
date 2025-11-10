// src/services/ChatService.ts
import type { IChatMessage } from "../models/ChatMessage";
import { User, type IUser } from "../models/User";
import { ProgressAttempt } from "../models/ProgressAttempt";
import { PracticeAttempt } from "../models/PracticeAttempt";
import { PlacementAttempt } from "../models/PlacementAttempt";
import { ChatMessage } from "../models/ChatMessage";
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
      description: "Thông tin người dùng: tên, email, trình độ, điểm TOEIC dự đoán, level từng part",
      keywords: ["thông tin", "profile", "trình độ", "level", "toeic", "điểm", "người dùng", "tài khoản"],
    },
    {
      name: "progressattempts",
      description: "Kết quả bài test progress: điểm tổng, listening, reading, accuracy, weak parts, thời gian làm bài",
      keywords: ["progress", "test", "kết quả", "điểm", "accuracy", "weak", "yếu", "cần cải thiện", "lịch sử test"],
    },
    {
      name: "practiceattempts",
      description: "Kết quả bài practice theo part và level: partKey, level, số câu đúng/sai, accuracy, thời gian",
      keywords: ["practice", "luyện tập", "part", "bài tập", "kết quả practice", "lịch sử practice"],
    },
    {
      name: "placementattempts",
      description: "Kết quả bài placement test: điểm tổng, listening, reading, level được xác định",
      keywords: ["placement", "kiểm tra đầu vào", "xác định trình độ", "placement test"],
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
      console.warn("[ChatService] ⚠️ Không có AI provider nào được cấu hình!");
      console.warn("[ChatService] Vui lòng cấu hình ít nhất một trong các biến môi trường sau:");
      console.warn("  - OPENAI_API_KEY (hoặc)");
      console.warn("  - GROQ_API_KEY");
    } else {
      console.log(
        `[ChatService] ✅ Đã khởi tạo ${this.providers.length} AI provider(s): ${this.providers.map((p) => `${p.name} (${p.model})`).join(", ")}`
      );
    }
  }

  /** System prompt: Trợ lý Tiếng Anh cho người Việt – compact */
  private buildSystemPrompt(userProfile?: UserProfile): { role: "system"; content: string } {
    const basePrompt = `Bạn là **Trợ lý Tiếng Anh** cho người Việt, CHỈ nội dung Tiếng Anh (TOEIC/IELTS).
- **Ngôn ngữ**: Giải thích bằng **Tiếng Việt**, ví dụ bằng **Tiếng Anh** (chỉ đổi khi người dùng yêu cầu).
- **Phạm vi**: CHỈ nội dung Tiếng Anh (TOEIC/IELTS, ngữ pháp, từ vựng, kỹ năng, dịch, sửa lỗi, lộ trình). Ngoài phạm vi → từ chối lịch sự và gợi ý quay lại chủ đề Tiếng Anh.
- **Phong cách**: Ngắn gọn, rõ ràng, dùng Markdown vừa phải; thêm emoji nhẹ (📚✅) khi phù hợp.
- **Thích nghi**: Ước lượng trình độ (beginner/intermediate/advanced) và điều chỉnh ví dụ/bài tập.
- **Sửa lỗi (format cố định)**: Error → Fix → Why → (Practice 1 câu).
- **Dịch**: Bản dịch + 2–3 ghi chú từ vựng/cấu trúc nổi bật.
- **TOEIC**: Nhận diện Part 1–7; đáp án ngắn gọn + keyword/distractor + 1 mẹo nhanh.
- **Tương tác**: Câu hỏi mơ hồ → hỏi lại **1 câu** kèm 2–3 lựa chọn (A/B/C).
- **Trung thực**: Thiếu dữ liệu → nói "Chưa đủ thông tin" và đề nghị đầu vào tối thiểu.
- **Khuôn mẫu trả lời** (tối đa 3 mục):
  1) **Ý chính** (1–2 câu)
  2) **Ví dụ/Minh họa**
  3) **Gợi ý luyện tập/câu hỏi tiếp theo**`;

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
      parts.push(`- **Trình độ**: ${levelMap[profile.level] || `Level ${profile.level}`}`);
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
      let partLevelsEntries: Array<{ partKey: string; partNumber: number; level: number }> = [];
      
      // Kiểm tra dạng nested: { part: { "1": 1, "2": 2, ... } }
      if (profile.partLevels.part && typeof profile.partLevels.part === "object") {
        partLevelsEntries = Object.entries(profile.partLevels.part)
          .map(([partNum, level]) => {
            const partNumber = parseInt(partNum, 10);
            const levelNum = typeof level === "number" ? level : parseInt(String(level), 10);
            return {
              partKey: `part.${partNumber}`,
              partNumber,
              level: levelNum,
            };
          })
          .filter((p) => !isNaN(p.partNumber) && p.partNumber >= 1 && p.partNumber <= 7);
      } else {
        // Dạng flat: { "part.1": 1, "part.2": 2, ... }
        partLevelsEntries = Object.entries(profile.partLevels)
          .map(([part, level]) => {
            const partNum = part.replace(/^part\./, ""); // Extract số từ "part.1" -> "1"
            const partNumber = parseInt(partNum, 10);
            const levelNum = typeof level === "number" ? level : parseInt(String(level), 10);
            return {
              partKey: part,
              partNumber,
              level: levelNum,
            };
          })
          .filter((p) => !isNaN(p.partNumber) && p.partNumber >= 1 && p.partNumber <= 7);
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
        const sortedByLevel = [...partLevelsEntries].sort((a, b) => a.level - b.level);
        
        if (sortedByLevel.length > 0) {
          const weakestParts = sortedByLevel.filter((p) => p.level === sortedByLevel[0].level);
          if (weakestParts.length > 0 && weakestParts[0].level < 3) {
            const partsStr = weakestParts.map((p) => `Part ${p.partNumber}`).join(", ");
            parts.push(`- **Cần tập trung cải thiện**: ${partsStr} (đang ở mức ${levelMap[weakestParts[0].level]})`);
          }
        }
      }
    }

    // Loại tài khoản
    if (profile.access) {
      parts.push(`- **Tài khoản**: ${profile.access === "premium" ? "Premium" : "Free"}`);
    }

    return parts.join("\n");
  }


  /** Bộ lọc “chỉ Tiếng Anh” – nới để không chặn nhầm câu chữa ngữ pháp */
  private isEnglishRelated(messages: Partial<IChatMessage>[]) {
    const lastMsg = messages.length
      ? String(messages[messages.length - 1]?.content ?? "")
      : "";
    const lower = lastMsg.toLowerCase();

    // 1) Từ khóa trực tiếp về English/ELT
    const directRe =
      /(tiếng anh|english|toeic|ielts|grammar|ngữ pháp|vocabulary|từ vựng|phát âm|pronunciation|listening|reading|writing|speaking|dịch|translate|sửa câu|thì|tenses|part\s*5|part\s*6|part\s*7|bài tập tiếng anh|collocation|phrasal verb|ielts task)/i;
    if (directRe.test(lower)) return true;

    // 2) Có từ tiếng Anh + tín hiệu "chữa bài" tiếng Việt (vd: "he are students sai chỗ nào")
    const hasAsciiWord = /[a-z][a-z'\-]+/i.test(lastMsg); // có từ a-z
    const viCue =
      /(sai|đúng|sửa|chữa|nghĩa|dịch|câu này|check|kiểm tra|phân tích|giải thích)/i.test(
        lower
      );
    if (hasAsciiWord && viCue) return true;

    // 3) Nhiều chữ cái tiếng Anh => có thể là câu English
    const letters = (lastMsg.match(/[a-z]/gi) || []).length;
    const ratio = letters / Math.max(lastMsg.length, 1);
    if (ratio > 0.25) return true;

    // 4) Loại trừ vài chủ đề kỹ thuật thường nhầm
    if (
      /(router|openwrt|docker|git|gmail|smtp|openai|mp3|android|rom|vlan|zerotier|mongodb|express|react|node\.js)/i.test(
        lower
      )
    ) {
      return false;
    }

    return false;
  }

  /** Tính level từ điểm TOEIC */
  private calculateLevelFromToeic(toeicPred: { overall: number | null } | null): number | undefined {
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
        const recentProgress = await ProgressAttempt.find({ userId: userObjectId })
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
        const recentPractices = await PracticeAttempt.find({ userId: userObjectId })
          .sort({ submittedAt: -1 })
          .limit(10)
          .lean();

        if (recentPractices.length > 0) {
          const partStatsMap: Record<string, { attempts: number; totalAcc: number }> = {};
          
          recentPractices.forEach((p) => {
            if (!partStatsMap[p.partKey]) {
              partStatsMap[p.partKey] = { attempts: 0, totalAcc: 0 };
            }
            partStatsMap[p.partKey].attempts++;
            partStatsMap[p.partKey].totalAcc += p.acc || 0;
          });

          const partStats: Record<string, { attempts: number; avgAccuracy: number }> = {};
          Object.entries(partStatsMap).forEach(([partKey, stats]) => {
            partStats[partKey] = {
              attempts: stats.attempts,
              avgAccuracy: Math.round((stats.totalAcc / stats.attempts) * 100) / 100,
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
        const recentPlacements = await PlacementAttempt.find({ userId: userObjectId })
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
      parts.push("## 📊 Kết quả Progress Test gần đây");
      if (context.userProgress.recentAttempts.length > 0) {
        parts.push(
          `- Tổng số bài test: ${context.userProgress.stats.totalAttempts}`
        );
        parts.push(
          `- Độ chính xác trung bình: ${context.userProgress.stats.averageAccuracy}%`
        );
        if (context.userProgress.stats.weakParts.length > 0) {
          parts.push(
            `- Phần cần cải thiện: ${context.userProgress.stats.weakParts.join(", ")}`
          );
        }
        parts.push("\n**3 bài test gần nhất:**");
        context.userProgress.recentAttempts.slice(0, 3).forEach((attempt, idx) => {
          parts.push(
            `${idx + 1}. Ngày ${new Date(attempt.submittedAt).toLocaleDateString("vi-VN")}: ${attempt.correct}/${attempt.total} câu đúng (${attempt.acc}%), Listening: ${attempt.listening?.acc || "N/A"}%, Reading: ${attempt.reading?.acc || "N/A"}%`
          );
        });
      }
    }

    if (context.practiceHistory) {
      parts.push("\n## 📝 Lịch sử Practice");
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
        context.practiceHistory.recentPractices.slice(0, 5).forEach((practice, idx) => {
          parts.push(
            `${idx + 1}. ${practice.partKey} (Level ${practice.level}): ${practice.correct}/${practice.total} câu đúng (${practice.acc}%)`
          );
        });
      }
    }

    if (context.placementHistory) {
      parts.push("\n## 🎯 Kết quả Placement Test");
      if (context.placementHistory.latestLevel) {
        parts.push(
          `- Level hiện tại: ${context.placementHistory.latestLevel}`
        );
      }
      if (context.placementHistory.recentPlacements.length > 0) {
        parts.push("**Lịch sử placement:**");
        context.placementHistory.recentPlacements.forEach((placement, idx) => {
          parts.push(
            `${idx + 1}. Ngày ${new Date(placement.submittedAt).toLocaleDateString("vi-VN")}: Level ${placement.level}, Accuracy: ${placement.acc}%`
          );
        });
      }
    }

    return parts.length > 0 ? parts.join("\n") : "";
  }

  /** Lấy thông tin user profile từ database */
  private async getUserProfile(userId?: string): Promise<UserProfile | undefined> {
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
        const errorMsg = `${provider.name} API ${resp.status}: ${errorText.slice(0, 2000)}`;
        console.error(`[ChatService] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      let data;
      try {
        data = await resp.json();
      } catch (e) {
        console.error(`[ChatService] ${provider.name} failed to parse JSON response:`, e);
        throw new Error(`${provider.name} invalid JSON response`);
      }
      
      if (!data?.choices?.[0]?.message?.content) {
        console.error(`[ChatService] ${provider.name} response không có content:`, JSON.stringify(data).slice(0, 500));
        throw new Error(`${provider.name} response không có content`);
      }

      const text = data.choices[0].message.content.trim();
      
      if (!text) {
        throw new Error(`${provider.name} trả về content rỗng`);
      }
      
      return text;
    } catch (err) {
      clearTimeout(timeoutId);
      
      // Nếu là timeout
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`${provider.name} request timeout (30s)`);
      }
      
      // Nếu là network error
      if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('network'))) {
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
      const lastMessage = messages[messages.length - 1]?.content?.slice(0, 50) || "";
      console.log(`[ChatService] generateResponse được gọi với ${messages.length} messages, userId: ${userId || "none"}, lastMessage: "${lastMessage}..."`);

      // Chặn sớm những câu hỏi ngoài phạm vi
      if (!this.isEnglishRelated(messages)) {
        console.log("[ChatService] Câu hỏi ngoài phạm vi, trả về OUT_OF_SCOPE");
        return ChatService.OUT_OF_SCOPE;
      }

      // Không có provider nào -> trả lỗi
      if (this.providers.length === 0) {
        console.error("[ChatService] ❌ Không có providers để gọi!");
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
          content: `${systemPrompt.content}\n\n## 📚 Dữ liệu từ hệ thống\n${dbContextText}\n\n**Lưu ý**: Sử dụng thông tin trên để đưa ra câu trả lời chính xác và cá nhân hóa dựa trên lịch sử học tập của người dùng.`,
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
          console.log(`[ChatService] Đang thử provider: ${provider.name} (${i + 1}/${this.providers.length})`);
          
          const response = await this.callProvider(provider, normalizedMessages, systemPrompt);
          
          // Nếu thành công và không phải provider đầu tiên, log để theo dõi
          if (i > 0) {
            console.log(`[ChatService] ✅ Fallback thành công: ${provider.name} đã thay thế ${this.providers[0].name}`);
          }
          
          return response;
    } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          lastError = error;
          
          console.error(
            `[ChatService] ❌ Provider ${provider.name} thất bại:`,
            error.message
          );
          
          // Nếu không phải provider cuối cùng, tiếp tục thử provider tiếp theo
          if (i < this.providers.length - 1) {
            console.log(`[ChatService] ⚠️ Chuyển sang provider dự phòng...`);
            continue;
          }
        }
      }

      // Tất cả providers đều fail
      if (lastError) {
        console.error("[ChatService] ❌ Tất cả providers đều thất bại. Lỗi cuối cùng:", {
          message: lastError.message,
          stack: lastError.stack,
        });
        
        // Trả về message lỗi cụ thể hơn
        const errorMsg = lastError.message || "Unknown error";
        if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
          return "Xin lỗi, API key không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ quản trị viên.";
        } else if (errorMsg.includes("429") || errorMsg.includes("rate limit")) {
          return "Xin lỗi, đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau vài phút.";
        } else if (errorMsg.includes("timeout")) {
          return "Xin lỗi, yêu cầu đã quá thời gian chờ (30s). Vui lòng thử lại sau.";
        } else if (errorMsg.includes("network")) {
          return "Xin lỗi, không thể kết nối đến AI service. Vui lòng kiểm tra kết nối mạng và thử lại.";
        }
        return `Xin lỗi, đã xảy ra lỗi khi tạo phản hồi: ${errorMsg}. Vui lòng thử lại sau.`;
      } else {
        console.error("[ChatService] ❌ Không có providers nào được cấu hình hoặc tất cả đều fail mà không có error");
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

}

export const chatService = new ChatService();
