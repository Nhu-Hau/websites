export type AuthMode = "login" | "register" | "forgot";

export type AuthErrors = Partial<{
  email: string;
  name: string;
  password: string;
  confirm: string;
}>;

export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72;

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

  // email
  if (!email) {
    errors.email = t("errorEmailRequired"); // "Vui lòng nhập email"
  } else if (!validateEmail(email)) {
    errors.email = t("errorEmailInvalid"); // "Email không hợp lệ"
  }

  if (mode === "register") {
    // name
    if (!name) {
      errors.name = t("errorNameRequired"); // "Vui lòng nhập họ tên"
    } else if (!validateName(name)) {
      errors.name = t("errorNameInvalid"); // "Tên chỉ gồm chữ, khoảng trắng, '-', ''', '.' (2–50 ký tự)"
    }

    // password
    if (!password) {
      errors.password = t("errorPasswordRequired"); // "Vui lòng nhập mật khẩu"
    } else if (!validatePassword(password)) {
      errors.password = t("errorPasswordWeak"); // "Tối thiểu 8 ký tự, có chữ và số, không khoảng trắng đầu/cuối"
    }

    // confirm
    if (!confirm) {
      errors.confirm = t("errorConfirmRequired"); // "Vui lòng nhập lại mật khẩu"
    } else if (password !== confirm) {
      errors.confirm = t("errorConfirmMismatch"); // "Mật khẩu xác nhận không khớp"
    }
  }

  if (mode === "login") {
    if (!password) {
      errors.password = t("errorPasswordRequired");
    } else if (!validatePassword(password)) {
      // ở login có thể nương tay hơn: chỉ check min length
      if (password.length < MIN_PASSWORD) {
        errors.password = t("errorPasswordLen");
      }
    }
  }

  // forgot: chỉ email phía trên

  return errors;
}

export function hasAuthErrors(e: AuthErrors) {
  return Object.keys(e).length > 0;
}
