import { Request, Response } from "express";
import { PromoCode, PromoDoc } from "../../shared/models/PromoCode";

export async function listPromoCodes(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10) || 20));
    const q = String(req.query.q || "").trim();

    const filter: any = {};
    if (q) {
      filter.code = { $regex: q, $options: "i" };
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      PromoCode.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<PromoDoc[]>(),
      PromoCode.countDocuments(filter),
    ]);

    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e: any) {
    console.error("[Admin Promo] List error:", e);
    return res.status(500).json({ message: "Lỗi khi lấy danh sách mã khuyến mãi" });
  }
}

export async function getPromoCode(req: Request, res: Response) {
  try {
    const { code } = req.params as { code: string };
    const promo = await PromoCode.findOne({ code: code.toUpperCase() }).lean<PromoDoc>();
    
    if (!promo) {
      return res.status(404).json({ message: "Mã khuyến mãi không tồn tại" });
    }

    return res.json(promo);
  } catch (e: any) {
    console.error("[Admin Promo] Get error:", e);
    return res.status(500).json({ message: "Lỗi khi lấy thông tin mã khuyến mãi" });
  }
}

export async function createPromoCode(req: Request, res: Response) {
  try {
    const {
      code,
      type,
      value,
      amountAfter,
      baseAmount,
      activeFrom,
      activeTo,
      maxUses,
      perUserLimit,
      allowedUsers,
    } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ message: "Mã khuyến mãi là bắt buộc" });
    }

    // Parse dates
    const parseDate = (dateStr: string | Date | null | undefined): Date | null => {
      if (!dateStr) return null;
      if (dateStr instanceof Date) return dateStr;
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const promoData: any = {
      code: code.trim().toUpperCase(),
    };

    if (type !== undefined) promoData.type = type;
    if (value !== undefined) promoData.value = value;
    if (amountAfter !== undefined) promoData.amountAfter = amountAfter;
    if (baseAmount !== undefined) promoData.baseAmount = baseAmount;
    
    const fromDate = parseDate(activeFrom);
    if (fromDate) promoData.activeFrom = fromDate;
    
    const toDate = parseDate(activeTo);
    if (toDate) promoData.activeTo = toDate;
    
    if (maxUses !== undefined) promoData.maxUses = maxUses;
    if (perUserLimit !== undefined) promoData.perUserLimit = perUserLimit;
    if (allowedUsers && Array.isArray(allowedUsers)) promoData.allowedUsers = allowedUsers;

    const promo = await PromoCode.create(promoData);
    return res.status(201).json(promo);
  } catch (e: any) {
    console.error("[Admin Promo] Create error:", e);
    if (e.code === 11000) {
      return res.status(400).json({ message: "Mã khuyến mãi đã tồn tại" });
    }
    return res.status(500).json({ message: "Lỗi khi tạo mã khuyến mãi" });
  }
}

export async function updatePromoCode(req: Request, res: Response) {
  try {
    const { code } = req.params as { code: string };
    const {
      type,
      value,
      amountAfter,
      baseAmount,
      activeFrom,
      activeTo,
      maxUses,
      perUserLimit,
      allowedUsers,
      usedCount,
    } = req.body;

    const promo = await PromoCode.findOne({ code: code.toUpperCase() });
    if (!promo) {
      return res.status(404).json({ message: "Mã khuyến mãi không tồn tại" });
    }

    // Parse dates
    const parseDate = (dateStr: string | Date | null | undefined): Date | null => {
      if (!dateStr) return null;
      if (dateStr instanceof Date) return dateStr;
      if (dateStr === "null" || dateStr === null) return null;
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    if (type !== undefined) promo.type = type;
    if (value !== undefined) promo.value = value;
    if (amountAfter !== undefined) promo.amountAfter = amountAfter;
    if (baseAmount !== undefined) promo.baseAmount = baseAmount;
    
    if (activeFrom !== undefined) {
      promo.activeFrom = parseDate(activeFrom);
    }
    
    if (activeTo !== undefined) {
      promo.activeTo = parseDate(activeTo);
    }
    
    if (maxUses !== undefined) promo.maxUses = maxUses;
    if (perUserLimit !== undefined) promo.perUserLimit = perUserLimit;
    if (allowedUsers !== undefined) {
      promo.allowedUsers = Array.isArray(allowedUsers) ? allowedUsers : [];
    }
    if (usedCount !== undefined) promo.usedCount = usedCount;

    await promo.save();
    return res.json(promo);
  } catch (e: any) {
    console.error("[Admin Promo] Update error:", e);
    return res.status(500).json({ message: "Lỗi khi cập nhật mã khuyến mãi" });
  }
}

export async function deletePromoCode(req: Request, res: Response) {
  try {
    const { code } = req.params as { code: string };
    const promo = await PromoCode.findOneAndDelete({ code: code.toUpperCase() });
    
    if (!promo) {
      return res.status(404).json({ message: "Mã khuyến mãi không tồn tại" });
    }

    return res.json({ message: "Đã xóa mã khuyến mãi" });
  } catch (e: any) {
    console.error("[Admin Promo] Delete error:", e);
    return res.status(500).json({ message: "Lỗi khi xóa mã khuyến mãi" });
  }
}

