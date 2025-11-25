# Placement Page I18n and Fixes

## Overview
Fixed a `FORMATTING_ERROR` in `CreateStudyRoomPage.tsx` and fully internationalized the `PlacementPage` component.

## Changes

### 1. Fix Formatting Error
- **File**: `frontend/src/components/features/study/CreateStudyRoomPage.tsx`
- **Issue**: The translation string used `<b>` tags but the code provided `highlight`.
- **Fix**: Updated the code to provide `b` tag handler to `rich` translation function.

### 2. Internationalize Placement Page
- **File**: `frontend/src/components/features/placement/index.tsx`
- **Changes**:
    - Extracted hardcoded strings (title, description, buttons, toasts).
    - Added new keys to `en.json` and `vi.json` under `placement.page`.
    - Implemented `useTranslations` hook.

### 3. Placement Logic
- Verified that `PlacementPage` checks for existing attempts and redirects if found, ensuring "only 1 test" per account.
- The `usePlacementTest` hook fetches the test from `/api/placement/paper`, which handles the random selection.

## Verification
- **Build**: `npm run build` passed successfully.
- **I18n**: All user-facing strings in `PlacementPage` are now localized.
