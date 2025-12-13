export type AuthMode = "login" | "register" | "forgot" | "register-anonymous";

export type AuthErrors = Partial<{
  email: string;
  name: string;
  password: string;
  confirm: string;
  username: string;
}>;

export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72;
export const MIN_PASSWORD_ANONYMOUS = 6;
export const MIN_USERNAME = 3;
export const MAX_USERNAME = 20;

// Username: 3-20 chars, alphanumeric and underscore, must start with letter
const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

// Email đơn giản, đủ dùng cho client-side
const EMAIL_RE =
  /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+-]+(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

// Name: cho phép ký tự chữ Unicode (\p{L}), khoảng trắng, gạch nối, nháy đơn, chấm
// Ví dụ hợp lệ: "Roald", "Nguyễn Nhật Ánh", "Hoàng Như Hậu", "Jean-Luc", "O'Connor", "Dr. Strange"
const NAME_RE = /^([A-ZÀ-Ỹ][\p{L}\p{M}'\-.]+)(\s[A-ZÀ-Ỹ][\p{L}\p{M}'\-.]+)*$/u;

// - Bắt đầu & kết thúc bằng chữ
// - Tổng độ dài: 2–50 ký tự (2 vì đã bắt đầu+ kết thúc; phần giữa {0,48})
// - Cho phép dấu thanh tiếng Việt (nhờ \p{M}), khoảng trắng, dấu ., ', -

export function validateEmail(v: string) {
  return EMAIL_RE.test(v.trim());
}

export function validateName(v: string) {
  const n = v.trim();
  if (n.length < 2 || n.length > 50) return false;
  return NAME_RE.test(n);
}

export function validatePassword(v: string) {
  const p = v;
  if (p.trim() !== p) return false; // không cho khoảng trắng ở đầu/cuối
  if (p.length < MIN_PASSWORD || p.length > MAX_PASSWORD) return false;
  // Ít nhất 1 chữ cái và 1 chữ số (bạn có thể bổ sung yêu cầu ký tự đặc biệt nếu muốn)
  const hasLetter = /[A-Za-zÀ-ỹ]/.test(p);
  const hasDigit = /\d/.test(p);
  return hasLetter && hasDigit;
}

export function validateUsername(v: string) {
  const u = v.trim();
  if (u.length < MIN_USERNAME || u.length > MAX_USERNAME) return false;
  return USERNAME_RE.test(u);
}

export function validateAuth(
  mode: AuthMode,
  data: Record<string, string>,
  t: (k: string) => string
): AuthErrors {
  const errors: AuthErrors = {};
  const name = String(data.name ?? "");
  const email = String(data.email ?? "");
  const password = String(data.password ?? "");
  const confirm = String(data.confirm ?? "");
  const username = String(data.username ?? "");

  // Common email validation for non-anonymous modes
  if (mode !== "register-anonymous") {
    if (!email) {
      errors.email = t("errorEmailRequired");
    } else if (!validateEmail(email)) {
      errors.email = t("errorEmailInvalid");
    }
  }

  if (mode === "register") {
    // name
    if (!name) {
      errors.name = t("errorNameRequired");
    } else if (!validateName(name)) {
      errors.name = t("errorNameInvalid");
    }

    // password
    if (!password) {
      errors.password = t("errorPasswordRequired");
    } else if (!validatePassword(password)) {
      errors.password = t("errorPasswordWeak");
    }

    // confirm
    if (!confirm) {
      errors.confirm = t("errorConfirmRequired");
    } else if (password !== confirm) {
      errors.confirm = t("errorConfirmMismatch");
    }
  }

  if (mode === "login") {
    // For login, we accept either email or username
    if (!email) {
      errors.email = t("errorIdentifierRequired");
    }
    // Don't validate email format - could be username

    if (!password) {
      errors.password = t("errorPasswordRequired");
    }
    // Don't validate password format at login - just check if provided
  }

  if (mode === "register-anonymous") {
    if (!username) {
      errors.username = t("errors.usernameRequired");
    } else if (!validateUsername(username)) {
      errors.username = t("errors.usernameInvalid");
    }

    if (!password) {
      errors.password = t("errors.passwordRequired");
    } else if (password.length < MIN_PASSWORD_ANONYMOUS) {
      errors.password = t("errors.passwordLen");
    }

    // Name is optional for anonymous
  }

  return errors;
}

export function hasAuthErrors(e: AuthErrors) {
  return Object.keys(e).length > 0;
}
