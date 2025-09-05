"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const markdownContent = `# 🎯 Luyện thi TOEIC

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

## 💡 Mẹo làm bài:

1. **Đọc câu hỏi trước** để biết cần tìm gì
2. **Scan** để tìm thông tin liên quan
3. **Đọc kỹ** đoạn văn chứa thông tin
4. **Loại trừ** các đáp án sai

### Code example:
\`\`\`javascript
function calculateScore(correct, total) {
  return (correct / total) * 100;
}
\`\`\`

> **Lưu ý**: Thời gian làm bài rất quan trọng, hãy phân bổ thời gian hợp lý!

Bạn muốn tìm hiểu về phần nào?`;

export default function MarkdownDemo() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Markdown Demo</h2>
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-lg font-bold mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-bold mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-bold mb-1">{children}</h3>
            ),
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-2 space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-2 space-y-1">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="text-sm">{children}</li>,
            code: ({ children, className }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                );
              }
              return (
                <code
                  className={`${className} block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto`}
                >
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 mb-2">
                {children}
              </blockquote>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
            a: ({ children, href }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {children}
              </a>
            ),
          }}
        >
          {markdownContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
