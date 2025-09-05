import { IChatMessage } from "../models/ChatMessage";

export class ChatService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  }

  async generateResponse(messages: Partial<IChatMessage>[]): Promise<string> {
    try {
      // Nếu không có API key, trả về phản hồi demo
      if (!this.apiKey) {
        return this.getDemoResponse(messages);
      }

      // Chuẩn bị messages cho OpenAI
      const openaiMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Thêm system prompt
      const systemPrompt = {
        role: "system",
        content: `Bạn là một trợ lý AI chuyên về luyện thi TOEIC. Bạn có thể:
        - Giải thích các câu hỏi TOEIC
        - Cung cấp mẹo làm bài thi
        - Giải thích ngữ pháp và từ vựng
        - Hướng dẫn chiến lược làm bài
        - Trả lời các câu hỏi về TOEIC
        
        Hãy trả lời một cách thân thiện, chính xác và hữu ích. Nếu câu hỏi không liên quan đến TOEIC, hãy nhẹ nhàng hướng cuộc trò chuyện về chủ đề TOEIC.`,
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [systemPrompt, ...openaiMessages],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return (
        data.choices[0]?.message?.content ||
        "Xin lỗi, tôi không thể tạo phản hồi."
      );
    } catch (error) {
      console.error("Error generating AI response:", error);
      return this.getDemoResponse(messages);
    }
  }

  private getDemoResponse(messages: Partial<IChatMessage>[]): string {
    const lastMessage =
      messages[messages.length - 1]?.content?.toLowerCase() || "";

    // Phản hồi demo dựa trên nội dung tin nhắn với Markdown format
    if (lastMessage.includes("toeic") || lastMessage.includes("thi")) {
      return `# 🎯 Luyện thi TOEIC

Tôi có thể giúp bạn luyện thi TOEIC! Dưới đây là các phần chính của bài thi:

## 📚 Cấu trúc bài thi TOEIC

### **Listening (100 câu - 45 phút)**
- **Part 1**: Mô tả tranh (6 câu)
- **Part 2**: Hỏi - đáp (25 câu)  
- **Part 3**: Đoạn hội thoại (39 câu)
- **Part 4**: Bài nói ngắn (30 câu)

### **Reading (100 câu - 75 phút)**
- **Part 5**: Hoàn thành câu (30 câu)
- **Part 6**: Hoàn thành đoạn văn (16 câu)
- **Part 7**: Đọc hiểu (54 câu)

Bạn muốn tìm hiểu về phần nào? Tôi có thể giúp bạn với:
- 📖 **Chiến lược làm bài** cho từng phần
- 📝 **Ngữ pháp** quan trọng
- 📚 **Từ vựng** theo chủ đề
- 💡 **Mẹo làm bài** hiệu quả`;
    }

    if (lastMessage.includes("listening") || lastMessage.includes("nghe")) {
      return `# 🎧 Phần Listening TOEIC

## Cấu trúc chi tiết:

### **Part 1: Mô tả tranh (6 câu)**
- Xem tranh và chọn câu mô tả đúng nhất
- **Mẹo**: Tập trung vào hành động, vị trí, số lượng

### **Part 2: Hỏi - đáp (25 câu)**
- Nghe câu hỏi và chọn câu trả lời phù hợp
- **Mẹo**: Chú ý từ khóa và ngữ cảnh

### **Part 3: Đoạn hội thoại (39 câu)**
- Nghe đoạn hội thoại và trả lời câu hỏi
- **Mẹo**: Đọc câu hỏi trước khi nghe

### **Part 4: Bài nói ngắn (30 câu)**
- Nghe bài nói và trả lời câu hỏi
- **Mẹo**: Tập trung vào thông tin chính

Bạn muốn tôi giải thích chi tiết phần nào?`;
    }

    if (lastMessage.includes("reading") || lastMessage.includes("đọc")) {
      return `# 📖 Phần Reading TOEIC

## Cấu trúc chi tiết:

### **Part 5: Hoàn thành câu (30 câu)**
- Chọn từ/cụm từ phù hợp để hoàn thành câu
- **Tập trung**: Ngữ pháp, từ vựng, collocation

### **Part 6: Hoàn thành đoạn văn (16 câu)**
- Chọn từ/cụm từ phù hợp để hoàn thành đoạn văn
- **Tập trung**: Ngữ cảnh, liên kết câu

### **Part 7: Đọc hiểu (54 câu)**
- **Part 7A**: Đọc hiểu đơn (29 câu)
- **Part 7B**: Đọc hiểu kép (25 câu)
- **Tập trung**: Kỹ năng đọc nhanh, tìm thông tin

## 💡 Chiến lược làm bài:
1. **Đọc câu hỏi trước** để biết cần tìm gì
2. **Scan** để tìm thông tin liên quan
3. **Đọc kỹ** đoạn văn chứa thông tin
4. **Loại trừ** các đáp án sai

Bạn muốn tôi hướng dẫn chi tiết phần nào?`;
    }

    if (lastMessage.includes("grammar") || lastMessage.includes("ngữ pháp")) {
      return `# 📝 Ngữ pháp TOEIC quan trọng

## Các chủ đề ngữ pháp chính:

### **1. Thì động từ (Tenses)**
- Present Simple/Continuous
- Past Simple/Perfect
- Future forms
- **Ví dụ**: "The meeting \`will be held\` tomorrow"

### **2. Câu điều kiện (Conditionals)**
- Type 1: If + present, will + V
- Type 2: If + past, would + V
- **Ví dụ**: "If I \`had\` more time, I \`would study\` harder"

### **3. Mệnh đề quan hệ (Relative Clauses)**
- who, which, that, where, when
- **Ví dụ**: "The book \`which\` I bought yesterday is interesting"

### **4. Giới từ (Prepositions)**
- in, on, at, by, for, with, of
- **Ví dụ**: "I'm interested \`in\` learning English"

### **5. Cấu trúc câu**
- Passive voice
- Reported speech
- Gerunds vs Infinitives

Bạn muốn tôi giải thích chi tiết chủ đề nào?`;
    }

    if (lastMessage.includes("vocabulary") || lastMessage.includes("từ vựng")) {
      return `# 📚 Từ vựng TOEIC theo chủ đề

## Các chủ đề từ vựng quan trọng:

### **🏢 Business & Office**
- **Meeting**: agenda, conference, presentation
- **Email**: correspondence, attachment, recipient
- **Office**: equipment, supplies, maintenance

### **✈️ Travel & Transportation**
- **Flight**: departure, arrival, boarding pass
- **Hotel**: reservation, check-in, amenities
- **Transport**: schedule, fare, route

### **🛍️ Shopping & Services**
- **Shopping**: purchase, refund, warranty
- **Banking**: account, transaction, interest
- **Restaurant**: menu, reservation, service

### **🏥 Health & Education**
- **Health**: appointment, prescription, treatment
- **Education**: curriculum, enrollment, tuition
- **Career**: promotion, salary, benefits

## 💡 Mẹo học từ vựng:
1. **Học theo chủ đề** thay vì học lẻ tẻ
2. **Tạo câu ví dụ** với từ mới
3. **Luyện tập thường xuyên** với flashcards
4. **Đọc nhiều** để gặp từ trong ngữ cảnh

Bạn muốn tôi giúp học từ vựng chủ đề nào?`;
    }

    return `# 🤖 Trợ lý AI TOEIC

Xin chào! Tôi là trợ lý AI chuyên về **TOEIC**. Tôi có thể giúp bạn:

## 🎯 Dịch vụ hỗ trợ:

### **📚 Luyện thi TOEIC**
- Giải thích cấu trúc bài thi
- Chiến lược làm bài hiệu quả
- Mẹo tiết kiệm thời gian

### **📝 Ngữ pháp & Từ vựng**
- Giải thích ngữ pháp quan trọng
- Từ vựng theo chủ đề
- Ví dụ thực tế

### **💡 Hướng dẫn chi tiết**
- Phân tích từng phần thi
- Lỗi thường gặp và cách tránh
- Lộ trình học tập

## 🚀 Bắt đầu ngay:
Hãy hỏi tôi bất kỳ câu hỏi nào về TOEIC! Ví dụ:
- "Giải thích Part 1 Listening"
- "Từ vựng chủ đề Business"
- "Mẹo làm Part 7 Reading"

**Bạn muốn hỏi gì?** 😊`;
  }
}

export const chatService = new ChatService();
