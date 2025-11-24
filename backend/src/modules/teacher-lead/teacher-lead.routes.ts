// backend/src/modules/teacher-lead/teacher-lead.routes.ts
import { Router } from "express";
import { sendMail } from "../../shared/services/email.service";
import { emailTemplates } from "../../shared/templates/email-templates";

const router = Router();

type LeadField =
  | "fullName"
  | "email"
  | "phone"
  | "scoreOrCert"
  | "experience"
  | "availability"
  | "message";

const REQUIRED_FIELDS: LeadField[] = [
  "fullName",
  "email",
  "phone",
  "scoreOrCert",
  "experience",
  "availability",
];

router.post("/teacher-leads", async (req, res) => {
  const payload = req.body || {};

  const missing = REQUIRED_FIELDS.filter(
    (field) => !payload[field] || !String(payload[field]).trim()
  );

  if (missing.length) {
    return res.status(400).json({
      message: `Thiếu thông tin bắt buộc: ${missing.join(", ")}`,
    });
  }

  const leadData: Record<LeadField, string> = {
    fullName: String(payload.fullName).trim(),
    email: String(payload.email).trim(),
    phone: String(payload.phone).trim(),
    scoreOrCert: String(payload.scoreOrCert || "").trim(),
    experience: String(payload.experience || "").trim(),
    availability: String(payload.availability || "").trim(),
    message: String(payload.message || "").trim(),
  };

  const adminEmailsRaw =
    process.env.TEACHER_LEAD_NOTIFY_TO ||
    process.env.ADMIN_EMAIL ||
    process.env.SMTP_USER ||
    "";

  const adminEmails = adminEmailsRaw.trim();

  if (!adminEmails) {
    return res.status(500).json({
      message:
        "Không thể gửi email vì thiếu cấu hình ADMIN_EMAIL/SMTP_USER trên server.",
    });
  }

  const recipients = adminEmails
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (!recipients.length) {
    return res.status(500).json({
      message:
        "Không thể gửi email vì cấu hình ADMIN_EMAIL/SMTP_USER rỗng. Vui lòng cập nhật lại file .env.",
    });
  }

  try {
    // 1. Gửi email cho admin
    const adminEmailHtml = emailTemplates.teacherRegistrationAdmin({
      fullName: leadData.fullName,
      email: leadData.email,
      phone: leadData.phone,
      scoreOrCert: leadData.scoreOrCert,
      experience: leadData.experience,
      availability: leadData.availability,
      message: leadData.message,
    });

    await sendMail({
      to: recipients.length === 1 ? recipients[0] : recipients,
      subject: `[Teacher Lead] ${leadData.fullName} (${leadData.email})`,
      html: adminEmailHtml,
    });

    // 2. Tự động phản hồi email cho user
    const userEmailHtml = emailTemplates.teacherRegistrationUser({
      fullName: leadData.fullName,
      email: leadData.email,
    });

    await sendMail({
      to: leadData.email,
      subject: "✅ Đăng ký giáo viên thành công - TOEIC Practice",
      html: userEmailHtml,
    });

    return res.json({ message: "Lead submitted" });
  } catch (error: any) {
    console.error("[teacher-leads] sendMail error:", error);
    return res.status(500).json({
      message:
        error?.message ||
        "Không thể gửi email thông báo. Vui lòng thử lại sau.",
    });
  }
});

export default router;

