// backend/src/modules/teacher-lead/teacher-lead.routes.ts
import { Router } from "express";
import { sendMail } from "../../shared/services/email.service";

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

  const rows = Object.entries(leadData)
    .map(
      ([key, value]) => `
        <tr>
          <td style="padding: 4px 8px; font-weight: 600; text-transform: capitalize; background:#f7f7f7">${key}</td>
          <td style="padding: 4px 8px;">${value || "<i>Không có</i>"}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family: Inter, Roboto, Arial, sans-serif; line-height: 1.5;">
      <h2>Thông tin đăng ký giáo viên mới</h2>
      <p>Người dùng vừa gửi form đăng ký trở thành giáo viên trên nền tảng TOEIC Practice.</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 640px;" border="1" cellpadding="0" cellspacing="0">
        ${rows}
      </table>
      <p style="margin-top:16px; font-size: 13px; color:#555;">Email này được gửi tự động từ hệ thống. Vui lòng trả lời trực tiếp cho ứng viên qua email hoặc số điện thoại ở trên.</p>
    </div>
  `;

  try {
    await sendMail({
      to: recipients.length === 1 ? recipients[0] : recipients,
      subject: `[Teacher Lead] ${leadData.fullName} (${leadData.email})`,
      html,
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

