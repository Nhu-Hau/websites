# Tối ưu hóa Website TOEIC PREP - Ghi chú thay đổi

## Tổng quan
Tài liệu này mô tả các thay đổi quan trọng đã được thực hiện để tối ưu hóa website theo các tiêu chí:
- Lighthouse Performance/SEO/Accessibility/Best Practices
- SEO nâng cao (structured data, metadata, sitemap)
- Motion system với Framer Motion
- Skeleton UI system
- Loading system thống nhất
- UI/UX đồng bộ

---

## 1. Hệ thống SEO Config (`/lib/seo/`)

### Files đã tạo:
- `lib/seo/config.ts`: Cấu hình SEO chính, utilities generate metadata
- `lib/seo/structured-data.ts`: Generators cho JSON-LD structured data
- `lib/seo/index.ts`: Main export

### Tính năng:
- **SITE_CONFIG**: Cấu hình site chính (name, description, URL, OG image)
- **generateMetadata()**: Tạo Next.js metadata object với đầy đủ OG tags, Twitter cards, canonical URLs
- **generateCanonical()**: Tạo canonical URLs cho multi-language
- **generateHreflang()**: Tạo hreflang tags cho vi/en
- **Structured Data**: Generators cho WebSite, BreadcrumbList, Article, Course, FAQPage schemas

### Sử dụng:
```typescript
import { generateMetadata, generateCanonical } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return generateMetadata({
    title: "Page Title",
    description: "Page description",
    keywords: ["keyword1", "keyword2"],
    canonical: generateCanonical("/path", locale),
  }, locale);
}
```

---

## 2. Sitemap & Robots.txt

### Files:
- `public/robots.txt`: Robots.txt với sitemap reference
- `src/app/sitemap.ts`: Dynamic sitemap generation cho tất cả routes và locales

### Tính năng:
- Tự động generate sitemap cho vi/en
- Bao gồm tất cả routes chính
- Priority và changeFrequency được set hợp lý

---

## 3. Skeleton UI System (`/components/common/Skeleton.tsx`)

### Components:
- **Skeleton**: Base skeleton component với variants (default, circular, rectangular, text)
- **CardSkeleton**: Skeleton cho card layout
- **VocabularyCardSkeleton**: Skeleton cho vocabulary cards
- **NewsCardSkeleton**: Skeleton cho news cards
- **DashboardStatsSkeleton**: Skeleton cho dashboard stats grid
- **ListItemSkeleton**: Skeleton cho list items (có thể có avatar)
- **TableSkeleton**: Skeleton cho tables
- **ChartSkeleton**: Skeleton cho charts
- **PageSkeleton**: Wrapper cho full page loading

### Sử dụng:
```tsx
import { CardSkeleton, VocabularyCardSkeleton } from "@/components/common/Skeleton";

// Trong Suspense fallback
<Suspense fallback={<CardSkeleton />}>
  <YourComponent />
</Suspense>
```

### Đặc điểm:
- Match exact layout của components thật → tránh CLS (Cumulative Layout Shift)
- Consistent styling (gray-200 dark:gray-800)
- Animate pulse mặc định
- Accessibility: aria-label="Loading..."

---

## 4. Loading System (`/components/common/Loading.tsx`)

### Components:
- **LoadingSpinner**: Spinner với sizes (sm, md, lg), có thể có text
- **LoadingOverlay**: Full-screen hoặc absolute overlay với backdrop blur
- **ButtonLoading**: Button với loading state (spinner overlay, text fade)
- **LoadingText**: Inline loading với text

### Sử dụng:
```tsx
import { LoadingSpinner, LoadingOverlay, ButtonLoading } from "@/components/common/Loading";

// Spinner
<LoadingSpinner size="md" text="Đang tải..." />

// Overlay
<LoadingOverlay show={isLoading} text="Đang tải dữ liệu..." />

// Button
<ButtonLoading loading={isSubmitting} className="btn-primary">
  Submit
</ButtonLoading>
```

### Đặc điểm:
- Consistent styling (blue-600 dark:blue-400)
- Accessibility: aria-label, aria-busy
- Smooth animations
- Backdrop blur cho overlay

---

## 5. Motion System (`/lib/motion/`)

### Files:
- `lib/motion/variants.ts`: Motion variants và config
- `lib/motion/components.tsx`: Reusable motion components
- `lib/motion/index.ts`: Main export

### Motion Config:
- **spring**: Stiff 300, damping 30 (cho interactions)
- **smooth**: Stiff 200, damping 25 (cho transitions)
- **gentle**: Stiff 150, damping 20 (cho subtle animations)
- **quick**: 0.2s tween (cho quick transitions)
- **default**: 0.3s tween với easing

### Variants:
- **fadeIn**: Fade in/out
- **slideUp/Down/Left/Right**: Slide animations
- **scaleIn**: Scale animations
- **modalBackdrop/Content**: Modal animations
- **cardHover**: Card hover effects
- **staggerContainer/Item**: Stagger animations
- **buttonTap**: Button tap feedback
- **toastSlide**: Toast slide in/out
- **pageTransition**: Page transitions

### Components:
- **MotionDiv**: Animated div với variants
- **MotionStagger**: Container cho stagger animations
- **MotionStaggerItem**: Item trong stagger container

### Sử dụng:
```tsx
import { MotionDiv, MotionStagger, MotionStaggerItem } from "@/lib/motion";
import { fadeIn, slideUp, staggerContainer } from "@/lib/motion/variants";

// Simple fade
<MotionDiv variant="fade">
  Content
</MotionDiv>

// Stagger list
<MotionStagger>
  {items.map(item => (
    <MotionStaggerItem key={item.id}>
      <Card>{item.content}</Card>
    </MotionStaggerItem>
  ))}
</MotionStagger>
```

### Áp dụng:
- Page transitions
- Modal open/close
- Card hover effects
- Button interactions
- Toast notifications
- List stagger animations

---

## 6. Metadata Updates

### Pages đã cập nhật:
- **Homepage** (`/[locale]/page.tsx`): 
  - Full metadata với keywords
  - Structured data: WebSite, FAQPage
  - Canonical URLs
  - OG tags, Twitter cards

- **Dashboard** (`/[locale]/(app)/dashboard/page.tsx`):
  - Metadata cho dashboard page
  - Keywords: dashboard TOEIC, tiến độ học

- **Vocabulary** (`/[locale]/(app)/vocabulary/page.tsx`):
  - Metadata cho vocabulary page
  - Keywords: từ vựng TOEIC, flashcards

- **News** (`/[locale]/(app)/news/page.tsx`):
  - Metadata cho news page
  - Keywords: tin tức TOEIC, TOEIC news

### Root Layout:
- Updated với SITE_CONFIG
- Preconnect cho fonts
- DNS prefetch cho API
- WebSite structured data

---

## 7. Performance Optimizations

### Images:
- **Next.js Image**: Đã có sẵn trong một số components (TestimonialAvatar)
- **Lazy Loading**: Đã có `loading="lazy"` trong một số img tags
- **Remote Patterns**: Đã config trong `next.config.ts` cho S3 và external images

### Recommendations (cần implement tiếp):
- Chuyển tất cả `<img>` tags sang `<Image>` từ `next/image`
- Thêm `priority` cho above-the-fold images
- Optimize image sizes và formats (WebP, AVIF)
- Preload critical images

### Code Splitting:
- Next.js tự động code splitting với App Router
- Dynamic imports cho heavy components

---

## 8. Accessibility Improvements

### Đã thêm:
- **Skeleton**: `aria-label="Loading..."`, `role="status"`
- **LoadingSpinner**: `aria-label="Loading"`
- **LoadingOverlay**: `role="status"`, `aria-label="Loading"`
- **ButtonLoading**: `aria-busy={loading}`, `disabled={loading}`
- **Accessibility Utilities** (`/lib/accessibility.ts`):
  - `getIconButtonLabel()`: Generate accessible labels for icon buttons
  - `getFieldDescription()`: Generate accessible descriptions for form fields
  - `getErrorMessage()`: Generate accessible error messages
  - `announceToScreenReader()`: ARIA live region announcements
  - `trapFocus()`: Focus trap for modals
  - `SkipToMainContent()`: Skip link component

### Sử dụng:
```typescript
import { getIconButtonLabel, announceToScreenReader } from "@/lib/accessibility";

<button aria-label={getIconButtonLabel("Close", "Close modal")}>
  <XIcon />
</button>

announceToScreenReader("Item added to cart");
```

### Cần thêm tiếp:
- Form labels đầy đủ (sử dụng utilities)
- Focus states cho tất cả interactive elements
- ARIA labels cho icons và buttons (sử dụng utilities)
- Contrast checks (WCAG AA) - utility đã có
- Keyboard navigation support - focus trap đã có

---

## 9. Best Practices

### Đã làm:
- Structured data JSON-LD
- Canonical URLs
- Hreflang tags
- Robots.txt
- Sitemap

### Cần làm tiếp:
- Loại bỏ console.log trong production
- Validate tất cả links (không có link rỗng)
- Alt text cho tất cả images
- HTTPS-safe code
- Error boundaries

---

## 10. UI/UX Đồng bộ

### Design Tokens (`/lib/design-tokens.ts`):
Đã tạo design tokens system với:
- **Spacing**: xs (4px) → 3xl (64px)
- **Border Radius**: none → full
- **Shadows**: sm → 2xl
- **Transitions**: fast (150ms), default (200ms), slow (300ms)
- **Z-Index**: base → toast (0 → 1080)
- **Typography**: fontSize, lineHeight, fontWeight
- **Breakpoints**: sm → 2xl (matching Tailwind)

### Sử dụng:
```typescript
import { spacing, borderRadius, shadows } from "@/lib/design-tokens";

<div style={{ padding: spacing.md, borderRadius: borderRadius.lg, boxShadow: shadows.md }}>
  Content
</div>
```

### Recommendations:
- Refactor components để dùng design tokens
- Loại bỏ hardcoded values
- Tạo unified Card và Chip components

---

## 11. Code Refactoring

### Đã tạo:
- SEO utilities (DRY principle)
- Skeleton system (reusable)
- Loading system (reusable)
- Motion system (reusable)

### Cần làm tiếp:
- Loại bỏ duplicate code
- Optimize hooks (memo, useMemo, useCallback)
- Tăng type-safety (loại bỏ `any`)
- Tách components lớn thành smaller components
- Extract constants

---

## 12. Next Steps

### Priority cao:
1. ✅ SEO system (done)
2. ✅ Skeleton system (done)
3. ✅ Loading system (done)
4. ✅ Motion system (done)
5. ⏳ Metadata cho tất cả pages (in progress)
6. ⏳ Chuyển img → next/image (pending)
7. ⏳ Accessibility improvements (pending)
8. ⏳ Design system (pending)
9. ⏳ Code refactoring (pending)

### Testing:
- Chạy Lighthouse cho tất cả pages chính
- Test trên mobile devices
- Test accessibility với screen readers
- Test performance với slow 3G

### Monitoring:
- Setup analytics để track Core Web Vitals
- Monitor Lighthouse scores
- Track SEO rankings

---

## Files Structure

```
frontend/
├── lib/
│   ├── seo/
│   │   ├── config.ts
│   │   ├── structured-data.ts
│   │   └── index.ts
│   ├── motion/
│   │   ├── variants.ts
│   │   ├── components.tsx
│   │   └── index.ts
│   ├── design-tokens.ts (new)
│   └── accessibility.ts (new)
├── components/
│   └── common/
│       ├── Skeleton.tsx (new)
│       └── Loading.tsx (new)
├── app/
│   ├── layout.tsx (updated)
│   ├── sitemap.ts (new)
│   └── [locale]/
│       ├── page.tsx (updated)
│       └── (app)/
│           ├── dashboard/page.tsx (updated)
│           ├── vocabulary/page.tsx (updated)
│           └── news/page.tsx (updated)
└── public/
    └── robots.txt (new)
```

---

## Notes

- Tất cả thay đổi giữ nguyên logic nghiệp vụ
- Không thay đổi BE contracts
- Backward compatible
- Type-safe với TypeScript

---

## Performance Targets

- **Lighthouse Performance**: 90+
- **Lighthouse SEO**: 100
- **Lighthouse Accessibility**: 95+
- **Lighthouse Best Practices**: 100

---

*Last updated: [Date]*


## Tổng quan
Tài liệu này mô tả các thay đổi quan trọng đã được thực hiện để tối ưu hóa website theo các tiêu chí:
- Lighthouse Performance/SEO/Accessibility/Best Practices
- SEO nâng cao (structured data, metadata, sitemap)
- Motion system với Framer Motion
- Skeleton UI system
- Loading system thống nhất
- UI/UX đồng bộ

---

## 1. Hệ thống SEO Config (`/lib/seo/`)

### Files đã tạo:
- `lib/seo/config.ts`: Cấu hình SEO chính, utilities generate metadata
- `lib/seo/structured-data.ts`: Generators cho JSON-LD structured data
- `lib/seo/index.ts`: Main export

### Tính năng:
- **SITE_CONFIG**: Cấu hình site chính (name, description, URL, OG image)
- **generateMetadata()**: Tạo Next.js metadata object với đầy đủ OG tags, Twitter cards, canonical URLs
- **generateCanonical()**: Tạo canonical URLs cho multi-language
- **generateHreflang()**: Tạo hreflang tags cho vi/en
- **Structured Data**: Generators cho WebSite, BreadcrumbList, Article, Course, FAQPage schemas

### Sử dụng:
```typescript
import { generateMetadata, generateCanonical } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return generateMetadata({
    title: "Page Title",
    description: "Page description",
    keywords: ["keyword1", "keyword2"],
    canonical: generateCanonical("/path", locale),
  }, locale);
}
```

---

## 2. Sitemap & Robots.txt

### Files:
- `public/robots.txt`: Robots.txt với sitemap reference
- `src/app/sitemap.ts`: Dynamic sitemap generation cho tất cả routes và locales

### Tính năng:
- Tự động generate sitemap cho vi/en
- Bao gồm tất cả routes chính
- Priority và changeFrequency được set hợp lý

---

## 3. Skeleton UI System (`/components/common/Skeleton.tsx`)

### Components:
- **Skeleton**: Base skeleton component với variants (default, circular, rectangular, text)
- **CardSkeleton**: Skeleton cho card layout
- **VocabularyCardSkeleton**: Skeleton cho vocabulary cards
- **NewsCardSkeleton**: Skeleton cho news cards
- **DashboardStatsSkeleton**: Skeleton cho dashboard stats grid
- **ListItemSkeleton**: Skeleton cho list items (có thể có avatar)
- **TableSkeleton**: Skeleton cho tables
- **ChartSkeleton**: Skeleton cho charts
- **PageSkeleton**: Wrapper cho full page loading

### Sử dụng:
```tsx
import { CardSkeleton, VocabularyCardSkeleton } from "@/components/common/Skeleton";

// Trong Suspense fallback
<Suspense fallback={<CardSkeleton />}>
  <YourComponent />
</Suspense>
```

### Đặc điểm:
- Match exact layout của components thật → tránh CLS (Cumulative Layout Shift)
- Consistent styling (gray-200 dark:gray-800)
- Animate pulse mặc định
- Accessibility: aria-label="Loading..."

---

## 4. Loading System (`/components/common/Loading.tsx`)

### Components:
- **LoadingSpinner**: Spinner với sizes (sm, md, lg), có thể có text
- **LoadingOverlay**: Full-screen hoặc absolute overlay với backdrop blur
- **ButtonLoading**: Button với loading state (spinner overlay, text fade)
- **LoadingText**: Inline loading với text

### Sử dụng:
```tsx
import { LoadingSpinner, LoadingOverlay, ButtonLoading } from "@/components/common/Loading";

// Spinner
<LoadingSpinner size="md" text="Đang tải..." />

// Overlay
<LoadingOverlay show={isLoading} text="Đang tải dữ liệu..." />

// Button
<ButtonLoading loading={isSubmitting} className="btn-primary">
  Submit
</ButtonLoading>
```

### Đặc điểm:
- Consistent styling (blue-600 dark:blue-400)
- Accessibility: aria-label, aria-busy
- Smooth animations
- Backdrop blur cho overlay

---

## 5. Motion System (`/lib/motion/`)

### Files:
- `lib/motion/variants.ts`: Motion variants và config
- `lib/motion/components.tsx`: Reusable motion components
- `lib/motion/index.ts`: Main export

### Motion Config:
- **spring**: Stiff 300, damping 30 (cho interactions)
- **smooth**: Stiff 200, damping 25 (cho transitions)
- **gentle**: Stiff 150, damping 20 (cho subtle animations)
- **quick**: 0.2s tween (cho quick transitions)
- **default**: 0.3s tween với easing

### Variants:
- **fadeIn**: Fade in/out
- **slideUp/Down/Left/Right**: Slide animations
- **scaleIn**: Scale animations
- **modalBackdrop/Content**: Modal animations
- **cardHover**: Card hover effects
- **staggerContainer/Item**: Stagger animations
- **buttonTap**: Button tap feedback
- **toastSlide**: Toast slide in/out
- **pageTransition**: Page transitions

### Components:
- **MotionDiv**: Animated div với variants
- **MotionStagger**: Container cho stagger animations
- **MotionStaggerItem**: Item trong stagger container

### Sử dụng:
```tsx
import { MotionDiv, MotionStagger, MotionStaggerItem } from "@/lib/motion";
import { fadeIn, slideUp, staggerContainer } from "@/lib/motion/variants";

// Simple fade
<MotionDiv variant="fade">
  Content
</MotionDiv>

// Stagger list
<MotionStagger>
  {items.map(item => (
    <MotionStaggerItem key={item.id}>
      <Card>{item.content}</Card>
    </MotionStaggerItem>
  ))}
</MotionStagger>
```

### Áp dụng:
- Page transitions
- Modal open/close
- Card hover effects
- Button interactions
- Toast notifications
- List stagger animations

---

## 6. Metadata Updates

### Pages đã cập nhật:
- **Homepage** (`/[locale]/page.tsx`): 
  - Full metadata với keywords
  - Structured data: WebSite, FAQPage
  - Canonical URLs
  - OG tags, Twitter cards

- **Dashboard** (`/[locale]/(app)/dashboard/page.tsx`):
  - Metadata cho dashboard page
  - Keywords: dashboard TOEIC, tiến độ học

- **Vocabulary** (`/[locale]/(app)/vocabulary/page.tsx`):
  - Metadata cho vocabulary page
  - Keywords: từ vựng TOEIC, flashcards

- **News** (`/[locale]/(app)/news/page.tsx`):
  - Metadata cho news page
  - Keywords: tin tức TOEIC, TOEIC news

### Root Layout:
- Updated với SITE_CONFIG
- Preconnect cho fonts
- DNS prefetch cho API
- WebSite structured data

---

## 7. Performance Optimizations

### Images:
- **Next.js Image**: Đã có sẵn trong một số components (TestimonialAvatar)
- **Lazy Loading**: Đã có `loading="lazy"` trong một số img tags
- **Remote Patterns**: Đã config trong `next.config.ts` cho S3 và external images

### Recommendations (cần implement tiếp):
- Chuyển tất cả `<img>` tags sang `<Image>` từ `next/image`
- Thêm `priority` cho above-the-fold images
- Optimize image sizes và formats (WebP, AVIF)
- Preload critical images

### Code Splitting:
- Next.js tự động code splitting với App Router
- Dynamic imports cho heavy components

---

## 8. Accessibility Improvements

### Đã thêm:
- **Skeleton**: `aria-label="Loading..."`, `role="status"`
- **LoadingSpinner**: `aria-label="Loading"`
- **LoadingOverlay**: `role="status"`, `aria-label="Loading"`
- **ButtonLoading**: `aria-busy={loading}`, `disabled={loading}`
- **Accessibility Utilities** (`/lib/accessibility.ts`):
  - `getIconButtonLabel()`: Generate accessible labels for icon buttons
  - `getFieldDescription()`: Generate accessible descriptions for form fields
  - `getErrorMessage()`: Generate accessible error messages
  - `announceToScreenReader()`: ARIA live region announcements
  - `trapFocus()`: Focus trap for modals
  - `SkipToMainContent()`: Skip link component

### Sử dụng:
```typescript
import { getIconButtonLabel, announceToScreenReader } from "@/lib/accessibility";

<button aria-label={getIconButtonLabel("Close", "Close modal")}>
  <XIcon />
</button>

announceToScreenReader("Item added to cart");
```

### Cần thêm tiếp:
- Form labels đầy đủ (sử dụng utilities)
- Focus states cho tất cả interactive elements
- ARIA labels cho icons và buttons (sử dụng utilities)
- Contrast checks (WCAG AA) - utility đã có
- Keyboard navigation support - focus trap đã có

---

## 9. Best Practices

### Đã làm:
- Structured data JSON-LD
- Canonical URLs
- Hreflang tags
- Robots.txt
- Sitemap

### Cần làm tiếp:
- Loại bỏ console.log trong production
- Validate tất cả links (không có link rỗng)
- Alt text cho tất cả images
- HTTPS-safe code
- Error boundaries

---

## 10. UI/UX Đồng bộ

### Design Tokens (`/lib/design-tokens.ts`):
Đã tạo design tokens system với:
- **Spacing**: xs (4px) → 3xl (64px)
- **Border Radius**: none → full
- **Shadows**: sm → 2xl
- **Transitions**: fast (150ms), default (200ms), slow (300ms)
- **Z-Index**: base → toast (0 → 1080)
- **Typography**: fontSize, lineHeight, fontWeight
- **Breakpoints**: sm → 2xl (matching Tailwind)

### Sử dụng:
```typescript
import { spacing, borderRadius, shadows } from "@/lib/design-tokens";

<div style={{ padding: spacing.md, borderRadius: borderRadius.lg, boxShadow: shadows.md }}>
  Content
</div>
```

### Recommendations:
- Refactor components để dùng design tokens
- Loại bỏ hardcoded values
- Tạo unified Card và Chip components

---

## 11. Code Refactoring

### Đã tạo:
- SEO utilities (DRY principle)
- Skeleton system (reusable)
- Loading system (reusable)
- Motion system (reusable)

### Cần làm tiếp:
- Loại bỏ duplicate code
- Optimize hooks (memo, useMemo, useCallback)
- Tăng type-safety (loại bỏ `any`)
- Tách components lớn thành smaller components
- Extract constants

---

## 12. Next Steps

### Priority cao:
1. ✅ SEO system (done)
2. ✅ Skeleton system (done)
3. ✅ Loading system (done)
4. ✅ Motion system (done)
5. ⏳ Metadata cho tất cả pages (in progress)
6. ⏳ Chuyển img → next/image (pending)
7. ⏳ Accessibility improvements (pending)
8. ⏳ Design system (pending)
9. ⏳ Code refactoring (pending)

### Testing:
- Chạy Lighthouse cho tất cả pages chính
- Test trên mobile devices
- Test accessibility với screen readers
- Test performance với slow 3G

### Monitoring:
- Setup analytics để track Core Web Vitals
- Monitor Lighthouse scores
- Track SEO rankings

---

## Files Structure

```
frontend/
├── lib/
│   ├── seo/
│   │   ├── config.ts
│   │   ├── structured-data.ts
│   │   └── index.ts
│   ├── motion/
│   │   ├── variants.ts
│   │   ├── components.tsx
│   │   └── index.ts
│   ├── design-tokens.ts (new)
│   └── accessibility.ts (new)
├── components/
│   └── common/
│       ├── Skeleton.tsx (new)
│       └── Loading.tsx (new)
├── app/
│   ├── layout.tsx (updated)
│   ├── sitemap.ts (new)
│   └── [locale]/
│       ├── page.tsx (updated)
│       └── (app)/
│           ├── dashboard/page.tsx (updated)
│           ├── vocabulary/page.tsx (updated)
│           └── news/page.tsx (updated)
└── public/
    └── robots.txt (new)
```

---

## Notes

- Tất cả thay đổi giữ nguyên logic nghiệp vụ
- Không thay đổi BE contracts
- Backward compatible
- Type-safe với TypeScript

---

## Performance Targets

- **Lighthouse Performance**: 90+
- **Lighthouse SEO**: 100
- **Lighthouse Accessibility**: 95+
- **Lighthouse Best Practices**: 100

---

*Last updated: [Date]*

