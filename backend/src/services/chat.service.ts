// src/services/ChatService.ts
import type { IChatMessage } from "../models/ChatMessage";

// Nếu chạy Node < 18, cần cài polyfill fetch:
//   npm i node-fetch
// rồi bỏ comment dòng dưới:
// import fetch from "node-fetch";

type OpenAIRole = "system" | "user" | "assistant";

export class ChatService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  private static readonly OUT_OF_SCOPE =
    "Xin lỗi, mình chỉ hỗ trợ **Tiếng Anh** (TOEIC/IELTS, ngữ pháp, từ vựng, phát âm, kỹ năng đọc–nghe–nói–viết...). Hãy hỏi mình về các chủ đề đó nhé!";

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY ?? "";
    this.baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
    this.model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  }

  /** System prompt: khóa phạm vi Tiếng Anh */
  private buildSystemPrompt(): { role: "system"; content: string } {
    return {
      role: "system",
      content: `Bạn là trợ lý học **Tiếng Anh** (ELT) cho người Việt.
CHỈ trả lời các yêu cầu liên quan đến Tiếng Anh: TOEIC/IELTS, ngữ pháp, từ vựng,
phát âm, sửa câu/dịch, kỹ năng đọc–nghe–nói–viết, lộ trình & mẹo học.
Nếu câu hỏi ngoài phạm vi, hãy từ chối lịch sự trong 1–2 câu và gợi ý quay lại chủ đề Tiếng Anh.

Quy tắc:
- Trả lời ngắn gọn, dễ hiểu, có ví dụ khi hữu ích.
- Dùng Markdown nhẹ (danh sách, **đậm**, \`code\`) cho dễ đọc.
- Nếu câu hỏi mơ hồ, hỏi lại 1 câu để làm rõ *nhưng vẫn trong phạm vi Tiếng Anh*.`,
    };
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

    // 4) Ngữ cảnh 3 tin gần nhất
    const ctx = messages
      .slice(-3)
      .map((m) => (m?.content ?? "").toString().toLowerCase())
      .join(" ");
    if (directRe.test(ctx)) return true;

    // 5) Loại trừ vài chủ đề kỹ thuật thường nhầm
    if (
      /(router|openwrt|docker|git|gmail|smtp|openai|mp3|android|rom|vlan|zerotier|mongodb|express|react|node\.js)/i.test(
        lower
      )
    ) {
      return false;
    }

    return false;
  }

  /** Gọi OpenAI tạo câu trả lời (nếu có API key) */
  async generateResponse(messages: Partial<IChatMessage>[]): Promise<string> {
    try {
      // Chặn sớm những câu hỏi ngoài phạm vi
      if (!this.isEnglishRelated(messages)) {
        return ChatService.OUT_OF_SCOPE;
      }

      // Không có API key -> trả demo có giới hạn phạm vi
      if (!this.apiKey) {
        return this.getDemoResponse(messages);
      }

      // Chuẩn hóa messages (mặc định role lạ -> 'user')
      const openaiMessages = messages
        .filter((m) => m?.content)
        .map((m) => {
          const role = (String(m.role) as OpenAIRole) || "user";
          const safeRole: OpenAIRole =
            role === "assistant" || role === "user" ? role : "user";
          return { role: safeRole, content: String(m.content) };
        });

      const body = {
        model: this.model,
        messages: [this.buildSystemPrompt(), ...openaiMessages],
        max_tokens: 800,
        temperature: 0.7,
      };

      const resp = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const text = await resp.text(); // log lỗi chi tiết
        throw new Error(`OpenAI API ${resp.status}: ${text.slice(0, 2000)}`);
      }

      const data = await resp.json();
      const text =
        data?.choices?.[0]?.message?.content?.trim() ??
        "Xin lỗi, tôi không thể tạo phản hồi.";
      return text;
    } catch (err) {
      console.error("[ChatService] generateResponse error:", err);
      // Fallback an toàn (vẫn giữ phạm vi)
      return this.getDemoResponse(messages);
    }
  }

  /** Demo trả lời (khi không có API key hoặc lỗi) – chỉ về Tiếng Anh */
  private getDemoResponse(messages: Partial<IChatMessage>[]): string {
    if (!this.isEnglishRelated(messages)) return ChatService.OUT_OF_SCOPE;

    const lastRaw = (messages[messages.length - 1]?.content ?? "").toString();
    const last = lastRaw.toLowerCase();

    // Nhận diện nhanh các lỗi phổ biến để minh họa (vd: "he are students")
    if (/\bhe\s+are\s+student(s)?\b/i.test(lastRaw)) {
      return `**Sửa câu:** \`he are students\`

**Sai** vì **he** (ngôi 3 số ít) phải đi với **is**, và danh từ đếm được số ít cần mạo từ.  
**Đúng:**
- \`He is a student.\`
- \`They are students.\` (nếu muốn số nhiều)
- \`He is one of the students.\` (1 người trong nhóm)

**Bảng to be (hiện tại):**  
I **am** · You **are** · He/She/It **is** · We/They **are**`;
    }

    if (last.includes("toeic") || last.includes("thi")) {
      return `# 🎯 Luyện thi TOEIC

## 📚 Cấu trúc
**Listening (100 – 45’)**: Part 1–4  
**Reading (100 – 75’)**: Part 5–7

Bạn muốn tập trung phần nào (vd: *Part 5 từ loại*, *Part 7 tìm thông tin*)? Mình sẽ kèm mẹo + ví dụ.`;
    }

    if (last.includes("listening") || last.includes("nghe")) {
      return `# 🎧 TOEIC Listening – Mẹo nhanh
- **Part 1:** chú ý hành động, vị trí, số lượng
- **Part 2:** nghe từ khóa; tránh bẫy đồng âm/chủ đề
- **Part 3–4:** đọc câu hỏi trước khi nghe; để ý tên riêng, số liệu`;
    }

    if (last.includes("reading") || last.includes("đọc")) {
      return `# 📖 TOEIC Reading – Chiến lược
- **Part 5:** ưu tiên thì, từ loại, collocation  
- **Part 6:** dựa ngữ cảnh trước–sau để chọn  
- **Part 7:** đọc câu hỏi → scan → đọc kỹ đoạn liên quan`;
    }

    if (last.includes("grammar") || last.includes("ngữ pháp")) {
      return `# 📝 Ngữ pháp trọng điểm
1) Thì & thể (present/past/future, passive)  
2) Từ loại (N/V/Adj/Adv)  
3) Mệnh đề quan hệ (who/which/that/where)  
4) Giới từ & collocations  
5) Câu điều kiện (Type 1/2/3)`;
    }

    if (last.includes("vocabulary") || last.includes("từ vựng")) {
      return `# 📚 Từ vựng theo chủ đề
- **Business/Office:** agenda, attachment, invoice  
- **Travel/Hotel:** reservation, itinerary, amenities  
- **Banking/Shopping:** refund, warranty, transaction

**Mẹo:** học theo chủ đề → tạo câu ví dụ → ôn cách quãng (spaced repetition)`;
    }

    // Mặc định: prompt mở cho English
    return `# 🤖 Trợ lý Tiếng Anh
Mình chuyên **TOEIC/IELTS, ngữ pháp, từ vựng, phát âm** và kỹ năng đọc–nghe–nói–viết.  
Bạn có thể hỏi:
- “Sửa câu này giúp mình”
- “Giải thích thì hiện tại hoàn thành”
- “Mẹo làm Part 7 TOEIC”`;
  }
}

export const chatService = new ChatService();
