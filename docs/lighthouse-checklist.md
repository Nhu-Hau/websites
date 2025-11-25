# Lighthouse Optimization Checklist

Use this list before every release to keep Lighthouse (Desktop) scores ≥95 without changing TOEICPREP's visual design.

## Performance
- [ ] LCP hero covers ≤2.5s: inline critical copy, defer below-the-fold sections with `dynamic()`, avoid blocking JS.
- [ ] FCP ≤1.5s: keep render-blocking CSS <70KB, load fonts via `next/font`, enable HTTP/2 server push/preload for above-the-fold assets.
- [ ] CLS ≤0.1: reserve width/height for images/media, lock in font metrics (font-display: swap), avoid injecting banners above existing content.
- [ ] TBT <200ms: code-split large client components, strip unused polyfills, lazy-load analytics/chat widgets.
- [ ] Images optimized: serve via `next/image`, use AVIF/WebP when possible, add `loading="lazy"` (except LCP hero), deliver exact display size.
- [ ] Fonts optimized: host via `next/font`, subset weights/styles actually used, preconnect to font/CDN origins if self-hosting.
- [ ] Caching: ensure `Cache-Control` headers for static assets (1y immutable), enable ISR or caching for data-heavy routes, memoize expensive fetches.
- [ ] Bundle size: keep main JS <200KB; inspect `next build` analyze output, tree-shake icon libraries, prefer per-icon imports.
- [ ] Hydration: minimize `use client` surface area, wrap non-critical sections in `dynamic(..., { ssr: true })`, move side effects to custom hooks.
- [ ] Third-party scripts: load with `next/script` + `strategy="lazyOnload"`, audit unused SDKs, gate chat widgets behind user interaction.

## Accessibility
- [ ] Provide descriptive `alt` text for all `<Image>`/`<img>` elements; treat decorative media with empty `alt`.
- [ ] Ensure every interactive icon/element uses semantic `<button>`/`<a>` tags with `type="button"` and `aria-label` when text is missing.
- [ ] Guarantee one `<h1>` per page and maintain logical heading order (h1 → h2 → h3).
- [ ] Validate color contrast ≥ WCAG AA (4.5:1 text, 3:1 large text); test light/dark themes separately.
- [ ] Expose visible focus states on all interactive controls (keyboard tabbing).
- [ ] Confirm keyboard navigation works for menus, modals, carousels, sliders (Arrow keys, Esc close, focus trapping when needed).
- [ ] Provide ARIA roles/states for complex widgets (tabs, accordions, carousels) and ensure live regions (`aria-live`) for async toasts.
- [ ] Label form inputs (`label for` or `aria-labelledby`), include error messaging tied via `aria-describedby`.
- [ ] Avoid motion-triggered content without pause/stop controls; respect `prefers-reduced-motion`.
- [ ] Validate language attributes (`<html lang="vi">`) and directionality for localized routes.

## SEO
- [ ] Set unique `title` + `description` per route via Next metadata API; keep title <60 chars, description ~155 chars.
- [ ] Provide canonical URLs + `alternates.languages` for localized routes, add `hreflang` where applicable.
- [ ] Configure Open Graph + Twitter cards with default banner (`/bannerTOEICPREP.png`) and per-page overrides.
- [ ] Include `meta[name="viewport"]` (already in `viewport` export) and ensure robots meta respects indexing strategy.
- [ ] Add structured data (WebSite, FAQ, Article) for high-value pages when content exists.
- [ ] Optimize link text—describe destination (no “click here”); ensure nav uses semantic `<nav>` and `aria-current`.
- [ ] Generate XML sitemap + robots (already in `app/robots.ts`/`sitemap.ts`) and keep updated when routes change.
- [ ] Lazy-load non-critical embeds but ensure fallback text for bots (SSR where possible).
- [ ] Compress critical images/assets to keep Largest Contentful Paint image <100KB.
- [ ] Monitor Core Web Vitals (CrUX, Vercel Analytics), regress if LCP >2.5s or CLS >0.1.

