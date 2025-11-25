# Translation Guidelines

## Tổng quan

Dự án này sử dụng `next-intl` để quản lý đa ngôn ngữ (i18n). Tất cả text hiển thị cho người dùng phải được chuyển sang dùng translation keys thay vì hardcode.

## Quy tắc

### ✅ Nên làm

1. **Luôn dùng `useTranslations()` cho client components:**
   ```tsx
   import { useTranslations } from "next-intl";
   
   export default function MyComponent() {
     const t = useTranslations("myNamespace");
     return <div>{t("myKey")}</div>;
   }
   ```

2. **Dùng `getTranslations()` cho server components:**
   ```tsx
   import { getTranslations } from "next-intl/server";
   
   export default async function MyPage() {
     const t = await getTranslations("myNamespace");
     return <div>{t("myKey")}</div>;
   }
   ```

3. **Thêm translation keys vào cả `en.json` và `vi.json`:**
   - Đảm bảo cấu trúc giống nhau
   - Đảm bảo tất cả keys đều có trong cả 2 file

4. **Dùng `t.rich()` cho text có HTML/formatting:**
   ```tsx
   t.rich("message", {
     bold: (chunks) => <strong>{chunks}</strong>,
     link: (chunks) => <a href="/">{chunks}</a>
   })
   ```

### ❌ Không nên làm

1. **Không hardcode text tiếng Việt:**
   ```tsx
   // ❌ SAI
   <div>Học từ vựng</div>
   
   // ✅ ĐÚNG
   <div>{t("vocabulary.title")}</div>
   ```

2. **Không hardcode text tiếng Anh (trừ khi là technical terms):**
   ```tsx
   // ❌ SAI
   <button>Start</button>
   
   // ✅ ĐÚNG
   <button>{t("button.start")}</button>
   ```

3. **Không bỏ qua translation trong metadata:**
   ```tsx
   // ❌ SAI
   export const metadata = {
     title: "Luyện thi TOEIC"
   };
   
   // ✅ ĐÚNG
   export async function generateMetadata({ params }) {
     const t = await getTranslations("metadata");
     return {
       title: t("title")
     };
   }
   ```

## Cấu trúc Translation Keys

### Quy tắc đặt tên

- Dùng namespace theo feature/page: `vocabulary`, `practice`, `dashboard`, etc.
- Dùng camelCase cho keys: `startButton`, `errorMessage`
- Nhóm keys theo context: `form.submit`, `form.cancel`

### Ví dụ cấu trúc

```json
{
  "vocabulary": {
    "page": {
      "title": "Vocabulary",
      "description": "Learn vocabulary"
    },
    "actions": {
      "add": "Add",
      "delete": "Delete"
    }
  }
}
```

## Kiểm tra Hardcoded Text

### Chạy script tự động

```bash
node scripts/check-hardcoded-text.js
```

Script này sẽ:
- Tìm tất cả file `.tsx` và `.ts` trong `src/`
- Phát hiện text tiếng Việt (có dấu)
- Phát hiện các cụm từ tiếng Anh phổ biến
- Bỏ qua comments và các pattern đặc biệt

### Kiểm tra thủ công

1. Tìm text có dấu tiếng Việt: `grep -r "[àáảãạ]" src/`
2. Tìm string literals: `grep -r '"[A-Z]' src/`
3. Kiểm tra metadata: Tìm `export const metadata` và đảm bảo dùng `generateMetadata`

## Checklist trước khi commit

- [ ] Không có hardcoded text tiếng Việt
- [ ] Không có hardcoded text tiếng Anh (trừ technical terms)
- [ ] Tất cả translation keys đã có trong cả `en.json` và `vi.json`
- [ ] Đã chạy script kiểm tra: `node scripts/check-hardcoded-text.js`
- [ ] Metadata đã dùng `generateMetadata` với `getTranslations`

## Xử lý lỗi translation

### Lỗi: "MISSING_MESSAGE: Could not resolve 'key'"

**Nguyên nhân:** Translation key không tồn tại trong file translation.

**Giải pháp:**
1. Kiểm tra key có đúng namespace không: `useTranslations("namespace")` → `t("key")`
2. Thêm key vào cả `en.json` và `vi.json`
3. Đảm bảo cấu trúc JSON hợp lệ

### Lỗi: Translation không hiển thị

**Nguyên nhân:** 
- Key không khớp
- Namespace sai
- File translation chưa được load

**Giải pháp:**
1. Kiểm tra namespace: `useTranslations("correctNamespace")`
2. Kiểm tra key path: `t("correct.path.to.key")`
3. Kiểm tra file translation có được import đúng không

## Best Practices

1. **Tổ chức keys theo feature:** Mỗi feature có namespace riêng
2. **Dùng nested structure:** Nhóm keys theo context
3. **Đặt tên rõ ràng:** Key name phải mô tả được nội dung
4. **Reuse keys:** Dùng lại keys cho text giống nhau
5. **Document keys:** Comment trong code về ý nghĩa của key

## Ví dụ đầy đủ

```tsx
// components/features/vocabulary/VocabularyCard.tsx
"use client";

import { useTranslations } from "next-intl";

export default function VocabularyCard() {
  const t = useTranslations("vocabulary.card");
  
  return (
    <div>
      <h3>{t("title")}</h3>
      <p>{t("description")}</p>
      <button>{t("actions.start")}</button>
    </div>
  );
}
```

```json
// messages/en.json
{
  "vocabulary": {
    "card": {
      "title": "Vocabulary Set",
      "description": "Learn new words",
      "actions": {
        "start": "Start Learning"
      }
    }
  }
}
```

```json
// messages/vi.json
{
  "vocabulary": {
    "card": {
      "title": "Bộ từ vựng",
      "description": "Học từ mới",
      "actions": {
        "start": "Bắt đầu học"
      }
    }
  }
}
```

