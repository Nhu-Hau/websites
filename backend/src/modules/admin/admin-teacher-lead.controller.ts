// backend/src/modules/admin/admin-teacher-lead.controller.ts
import { Request, Response } from "express";
import { TeacherLead, TeacherLeadStatus } from "../../shared/models/TeacherLead";
import { User } from "../../shared/models/User";
import { sendMail } from "../../shared/services/email.service";
import { FilterQuery } from "mongoose";

export async function adminListTeacherLeads(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;
        const q = (req.query.q as string || "").trim();

        const filter: FilterQuery<typeof TeacherLead> = {};
        if (status && ["pending", "approved", "rejected"].includes(status)) {
            filter.status = status;
        }
        if (q) {
            filter.$or = [
                { fullName: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } },
                { phone: { $regex: q, $options: "i" } },
            ];
        }

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            TeacherLead.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            TeacherLead.countDocuments(filter),
        ]);

        const pages = Math.ceil(total / limit);

        return res.json({ items, total, page, limit, pages });
    } catch (error) {
        console.error("adminListTeacherLeads error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function adminGetTeacherLead(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const lead = await TeacherLead.findById(id).lean();

        if (!lead) {
            return res.status(404).json({ message: "Teacher lead not found" });
        }

        return res.json({ item: lead });
    } catch (error) {
        console.error("adminGetTeacherLead error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function adminApproveTeacherLead(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const adminId = (req as any).auth?.userId;
        const { adminNote } = req.body || {};

        const lead = await TeacherLead.findById(id);
        if (!lead) {
            return res.status(404).json({ message: "Teacher lead not found" });
        }

        if (lead.status !== "pending") {
            return res.status(400).json({ message: "Đơn đăng ký này đã được xử lý" });
        }

        // Find or check if user with this email exists
        let user = await User.findOne({ email: lead.email });

        if (user) {
            // Update existing user to teacher role
            user.role = "teacher";
            await user.save();
            console.log(`✅ User ${user.email} upgraded to teacher role`);
        } else {
            console.log(`⚠️ No user account found for ${lead.email}, only marking lead as approved`);
        }

        // Update lead status
        lead.status = "approved";
        lead.reviewedBy = adminId;
        lead.reviewedAt = new Date();
        if (adminNote) lead.adminNote = adminNote;
        await lead.save();

        // Send approval email to user
        try {
            await sendMail({
                to: lead.email,
                subject: "🎉 Chúc mừng! Bạn đã được duyệt làm Giáo viên - TOEIC Practice",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #10B981;">🎉 Chúc mừng ${lead.fullName}!</h2>
                        <p>Đơn đăng ký giáo viên của bạn đã được <strong>DUYỆT</strong>.</p>
                        ${user ? `
                            <p>Tài khoản của bạn (${lead.email}) đã được nâng cấp lên quyền <strong>Giáo viên</strong>.</p>
                            <p>Bạn có thể đăng nhập và tạo phòng học trực tuyến ngay bây giờ!</p>
                        ` : `
                            <p>Vui lòng đăng ký tài khoản với email <strong>${lead.email}</strong> để được cấp quyền Giáo viên.</p>
                        `}
                        ${adminNote ? `<p><strong>Ghi chú từ Admin:</strong> ${adminNote}</p>` : ""}
                        <p style="margin-top: 20px;">Trân trọng,<br/>TOEIC Practice Team</p>
                    </div>
                `,
            });
        } catch (emailError) {
            console.error("Failed to send approval email:", emailError);
        }

        console.log(`✅ Teacher lead ${lead.email} approved by admin ${adminId}`);

        return res.json({
            message: "Đã duyệt đơn đăng ký giáo viên",
            item: lead,
            userUpgraded: !!user,
        });
    } catch (error) {
        console.error("adminApproveTeacherLead error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function adminRejectTeacherLead(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const adminId = (req as any).auth?.userId;
        const { adminNote } = req.body || {};

        const lead = await TeacherLead.findById(id);
        if (!lead) {
            return res.status(404).json({ message: "Teacher lead not found" });
        }

        if (lead.status !== "pending") {
            return res.status(400).json({ message: "Đơn đăng ký này đã được xử lý" });
        }

        // Update lead status
        lead.status = "rejected";
        lead.reviewedBy = adminId;
        lead.reviewedAt = new Date();
        if (adminNote) lead.adminNote = adminNote;
        await lead.save();

        // Send rejection email to user
        try {
            await sendMail({
                to: lead.email,
                subject: "Thông báo về đơn đăng ký Giáo viên - TOEIC Practice",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #EF4444;">Xin chào ${lead.fullName},</h2>
                        <p>Cảm ơn bạn đã quan tâm đến vị trí Giáo viên tại TOEIC Practice.</p>
                        <p>Sau khi xem xét, chúng tôi rất tiếc phải thông báo rằng đơn đăng ký của bạn <strong>chưa được duyệt</strong> lần này.</p>
                        ${adminNote ? `<p><strong>Lý do:</strong> ${adminNote}</p>` : ""}
                        <p>Bạn có thể đăng ký lại sau khi đáp ứng đủ các yêu cầu.</p>
                        <p style="margin-top: 20px;">Trân trọng,<br/>TOEIC Practice Team</p>
                    </div>
                `,
            });
        } catch (emailError) {
            console.error("Failed to send rejection email:", emailError);
        }

        console.log(`❌ Teacher lead ${lead.email} rejected by admin ${adminId}`);

        return res.json({
            message: "Đã từ chối đơn đăng ký giáo viên",
            item: lead,
        });
    } catch (error) {
        console.error("adminRejectTeacherLead error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function adminDeleteTeacherLead(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const lead = await TeacherLead.findById(id);
        if (!lead) {
            return res.status(404).json({ message: "Teacher lead not found" });
        }

        await TeacherLead.deleteOne({ _id: id });

        console.log(`🗑️ Teacher lead ${lead.email} deleted by admin`);

        return res.json({ message: "Đã xóa đơn đăng ký" });
    } catch (error) {
        console.error("adminDeleteTeacherLead error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
