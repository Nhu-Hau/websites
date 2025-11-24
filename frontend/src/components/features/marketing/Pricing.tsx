/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiBase } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  MessageSquare,
  PlayCircle,
  Layers,
  BarChart3,
  ShieldCheck,
  Bot,
  Infinity as InfinityIcon,
  Loader2,
  Crown,
  BadgePercent,
  X,
  Star,
  Zap,
  FileDown,
  Upload,
  MessageCircle,
  Brain,
  Users,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useTranslations } from "next-intl";

type PayResp = {
  data?: { checkoutUrl: string; qrCode?: string; orderCode: number };
};

type PaymentPlan = "monthly_79" | "monthly_159";

type PromoPreview = {
  code: string;
  amountBefore: number;
  amountAfter: number;
  type?: "fixed" | "percent";
  value?: number;
  plan: PaymentPlan;
};

type FeatureRow = {
  key: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  free: React.ReactNode;
  pro: React.ReactNode;
};

/* ================== Motion ================== */

const sectionFade: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const cardsStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardFade: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Pricing() {
  const router = useRouter();
  const basePrefix = useBasePrefix("vi");
  const { user } = useAuth();
  const isPremium = user?.access === "premium";
  const t = useTranslations("marketing.pricing");

  const [loading, setLoading] = useState(false);

  // promo code: tách riêng 2 input
  const [code79, setCode79] = useState("");
  const [code159, setCode159] = useState("");
  const [checkingPlan, setCheckingPlan] = useState<PaymentPlan | null>(null);
  const [promo, setPromo] = useState<PromoPreview | null>(null);
  const [promoErr, setPromoErr] = useState<Record<PaymentPlan, string | null>>({
    monthly_79: null,
    monthly_159: null,
  });

  const monthlyBase = 79_000;
  const plusBase = 159_000;
  const renderLocked = React.useCallback(
    (label: string) => (
      <span className="inline-flex items-center gap-1 text-slate-500">
        <XCircle className="h-4 w-4" />
        <span>{label}</span>
      </span>
    ),
    []
  );

  const renderUnlocked = React.useCallback(
    (label: string) => (
      <span className="inline-flex items-center gap-1 text-emerald-400">
        <CheckCircle2 className="h-4 w-4" />
        <span>{label}</span>
      </span>
    ),
    []
  );

  const { monthlyPrice, plusPrice } = useMemo(() => {
    const monthlyFinal =
      promo && promo.plan === "monthly_79" ? promo.amountAfter : monthlyBase;
    const plusFinal =
      promo && promo.plan === "monthly_159" ? promo.amountAfter : plusBase;

    return {
      monthlyPrice: {
        base: monthlyBase,
        final: monthlyFinal,
        hasPromo:
          !!promo &&
          promo.plan === "monthly_79" &&
          monthlyFinal !== monthlyBase,
      },
      plusPrice: {
        base: plusBase,
        final: plusFinal,
        hasPromo:
          !!promo && promo.plan === "monthly_159" && plusFinal !== plusBase,
      },
    };
  }, [promo, monthlyBase, plusBase]);

  const monthlyPromoActive =
    promo?.plan === "monthly_79" && monthlyPrice.hasPromo;
  const plusPromoActive = promo?.plan === "monthly_159" && plusPrice.hasPromo;
  const monthlyUpgradeLabel = monthlyPromoActive
    ? t("buttons.upgradeMonthlyPromo", {
        price: Math.round(monthlyPrice.final / 1000),
      })
    : t("buttons.upgradeMonthly");
  const quarterlyUpgradeLabel = plusPromoActive
    ? t("buttons.upgradeQuarterlyPromo", {
        price: Math.round(plusPrice.final / 1000),
      })
    : t("buttons.upgradeQuarterly");
  const monthlyPriceAfterLabel = t("promo.priceAfter", {
    price: `${Math.round(monthlyPrice.final / 1000)}.000đ`,
  });
  const quarterlyPriceAfterLabel = t("promo.priceAfter", {
    price: `${Math.round(plusPrice.final / 1000)}.000đ`,
  });
  const processingLabel = t("buttons.processing");
  const currentPlanLabel = t("buttons.currentPlan");

  async function onApplyCode(inputCode: string, planForPromo: PaymentPlan) {
    setPromoErr((prev) => ({ ...prev, [planForPromo]: null }));
    if (!user) {
      router.push(`${basePrefix}/login`);
      return;
    }
    const trimmed = inputCode.trim();
    if (!trimmed) return;

    setCheckingPlan(planForPromo);
    try {
      const r = await fetch(`${apiBase()}/api/payments/promo/validate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmed,
          plan: planForPromo,
        }),
      });
      const j = await r.json();
      if (!r.ok)
        throw new Error(j?.message || t("errors.promoInvalid"));

      const appliedPlan =
        (j?.data?.plan as PaymentPlan | undefined) ?? planForPromo;

      setPromo({
        code: j.data.code,
        amountBefore: j.data.amountBefore,
        amountAfter: j.data.amountAfter,
        type: j.data.type,
        value: j.data.value,
        plan: appliedPlan,
      });

      // ✅ Clear đúng input theo plan sau khi áp dụng thành công
      if (appliedPlan === "monthly_79") {
        setCode79("");
      } else if (appliedPlan === "monthly_159") {
        setCode159("");
      }
    } catch (e: any) {
      setPromo(null);
      setPromoErr((prev) => ({
        ...prev,
        [planForPromo]: e?.message || t("errors.promoCheckFailed"),
      }));
    } finally {
      setCheckingPlan(null);
    }
  }

  function clearCode() {
    setPromo(null);
    setPromoErr({
      monthly_79: null,
      monthly_159: null,
    });
    setCode79("");
    setCode159("");
  }

  const handleUpgrade = async (plan: PaymentPlan) => {
    if (!user) {
      router.push(`${basePrefix}/login`);
      return;
    }
    if (isPremium) return;

    setLoading(true);
    try {
      const resp = await fetch(`${apiBase()}/api/payments/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          promoCode: promo?.plan === plan ? promo.code : undefined,
        }),
      });
      const json: PayResp = await resp.json();
      if (!resp.ok)
        throw new Error(
          (json as any)?.message || t("errors.paymentLink")
        );
      const url = json?.data?.checkoutUrl;
      if (!url) throw new Error(t("errors.missingCheckout"));
      window.location.href = url;
    } catch (e: any) {
      alert(e?.message || t("errors.paymentGeneric"));
      console.error("Error creating payment:", e);
    } finally {
      setLoading(false);
    }
  };

  // ========= BẢNG SO SÁNH TÍNH NĂNG =========
  const rows: FeatureRow[] = useMemo(
    () => [
      {
        key: "practice",
        label: t("comparison.practice.label"),
        description: t("comparison.practice.description"),
        icon: <Layers className="h-4 w-4" />,
        free: <>{t("comparison.practice.free")}</>,
        pro: (
          <span className="inline-flex items-center gap-1">
            <InfinityIcon className="h-4 w-4 text-[#4063bb]" />
            <span>{t("comparison.practice.pro")}</span>
          </span>
        ),
      },
      {
        key: "ai-chat",
        label: t("comparison.aiChat.label"),
        description: t("comparison.aiChat.description"),
        icon: <Bot className="h-4 w-4" />,
        free: renderLocked(t("comparison.locked")),
        pro: renderUnlocked(t("comparison.unlocked")),
      },
      {
        key: "admin-chat",
        label: t("comparison.adminChat.label"),
        description: t("comparison.adminChat.description"),
        icon: <MessageSquare className="h-4 w-4" />,
        free: renderLocked(t("comparison.locked")),
        pro: renderUnlocked(t("comparison.unlocked")),
      },
      {
        key: "vocab-translate",
        label: t("comparison.vocab.label"),
        description: t("comparison.vocab.description"),
        icon: <Sparkles className="h-4 w-4" />,
        free: renderLocked(t("comparison.locked")),
        pro: renderUnlocked(t("comparison.unlocked")),
      },
      {
        key: "livestream-comments",
        label: t("comparison.livestream.label"),
        description: t("comparison.livestream.description"),
        icon: <MessageCircle className="h-4 w-4" />,
        free: t.rich("comparison.livestream.free", {
          note: (chunks) => (
            <span className="text-xs text-slate-500">{chunks}</span>
          ),
        }),
        pro: renderUnlocked(t("comparison.unlimited")),
      },
      {
        key: "download-files",
        label: t("comparison.download.label"),
        description: t("comparison.download.description"),
        icon: <FileDown className="h-4 w-4" />,
        free: renderLocked(t("comparison.locked")),
        pro: renderUnlocked(t("comparison.unlocked")),
      },
      {
        key: "upload-files",
        label: t("comparison.upload.label"),
        description: t("comparison.upload.description"),
        icon: <Upload className="h-4 w-4" />,
        free: renderLocked(t("comparison.locked")),
        pro: renderUnlocked(t("comparison.unlocked")),
      },
      {
        key: "learning-insight",
        label: t("comparison.insight.label"),
        description: t("comparison.insight.description"),
        icon: <Brain className="h-4 w-4" />,
        free: renderLocked(t("comparison.locked")),
        pro: renderUnlocked(t("comparison.unlocked")),
      },
      {
        key: "groups",
        label: t("comparison.groups.label"),
        description: t("comparison.groups.description"),
        icon: <Users className="h-4 w-4" />,
        free: renderLocked(t("comparison.locked")),
        pro: renderUnlocked(t("comparison.unlocked")),
      },
    ],
    [renderLocked, renderUnlocked, t]
  );

  const freeFeatures = useMemo(
    () => [
      t("plans.free.features.0"),
      t("plans.free.features.1"),
      t("plans.free.features.2"),
      t("plans.free.features.3"),
    ],
    [t]
  );

  const premiumFeatures = useMemo(
    () => [
      t("plans.monthly.features.0"),
      t("plans.monthly.features.1"),
      t("plans.monthly.features.2"),
      t("plans.monthly.features.3"),
    ],
    [t]
  );

  const premiumPlusFeatures = useMemo(
    () => [
      t("plans.quarterly.features.0"),
      t("plans.quarterly.features.1"),
      t("plans.quarterly.features.2"),
    ],
    [t]
  );

  return (
    <section className="relative overflow-hidden py-16">
      {/* Nền gradient chủ đạo #4063bb / sky / emerald */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#4063bb0f] via-sky-200/30 to-emerald-100/20 dark:from-[#4063bb22] dark:via-sky-500/5 dark:to-emerald-500/5" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#4063bb26] blur-[120px] dark:bg-[#4063bb33]" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-50 dark:bg-sky-950/50 px-4 py-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              {t("eyebrow")}
            </span>
          </div>
          <h2 className="font-manrope text-3xl font-bold text-[#1f2a3d] sm:text-4xl lg:text-5xl dark:text-slate-50">
            {t("title")}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
            {t("description")}
          </p>
        </motion.div>

        {/* Cards pricing 3 cột */}
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch"
          variants={cardsStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* FREE 0đ/tháng */}
          <motion.article
            variants={cardFade}
            className="group relative order-1 flex h-full flex-col rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-xl shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/95 sm:p-7"
          >
            <div className="border-b border-slate-200 pb-6 mb-6 dark:border-slate-800">
              <div className="mx-auto">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4063bb] to-sky-500 shadow-lg shadow-[#4063bb4d] xs:h-10 xs:w-10">
                  <Star className="h-5 w-5 text-white" />
                </div>
              </div>
              <h3 className="mt-5 text-center font-manrope text-xl font-bold text-[#4063bb] dark:text-sky-200">
                {t("plans.free.name")}
              </h3>
              <div className="mt-3 flex items-center justify-center">
                <span className="font-manrope text-3xl font-semibold text-slate-900 dark:text-slate-50">
                  {t("plans.free.price")}
                </span>
                <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                  {t("plans.period.month")}
                </span>
              </div>
              <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
                {t("plans.free.description")}
              </p>
            </div>

            <ul className="mb-8 space-y-3 text-sm text-slate-700 dark:text-slate-200">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <Link
                href={`${basePrefix}/register`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4063bb] focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950"
              >
                <Star className="h-4 w-4" />
                {t("plans.free.cta")}
              </Link>
            </div>
          </motion.article>

          {/* PREMIUM 79k/tháng – card thường */}
          <motion.article
            variants={cardFade}
            className="group relative order-3 flex h-full flex-col rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-xl shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/95 sm:p-7 md:order-2"
          >
            <div className="border-b border-slate-200 pb-6 mb-6 dark:border-slate-800">
              <div className="mx-auto">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4063bb] to-sky-500 shadow-lg shadow-[#4063bb4d] xs:h-10 xs:w-10">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
              </div>
              <h3 className="mt-5 text-center font-manrope text-xl font-bold text-[#4063bb] dark:text-sky-200">
                {t("plans.monthly.name")}
              </h3>
              <div className="mt-3 flex items-center justify-center">
                {monthlyPromoActive ? (
                  <>
                    <span className="text-lg font-normal text-slate-400 line-through dark:text-slate-500">
                      {Math.round(monthlyPrice.base / 1000)}k
                    </span>
                    <span className="ml-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      {Math.round(monthlyPrice.final / 1000)}k
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {t("plans.monthly.price")}
                  </span>
                )}
                <span className="ml-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {t("plans.period.month")}
                </span>
              </div>
              <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
                {t("plans.monthly.description")}
              </p>
              {monthlyPromoActive && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                  <BadgePercent className="h-3 w-3" />
                  {t("promo.applied", { code: promo?.code ?? "" })}
                </div>
              )}
            </div>

            {/* Promo input cho 79k */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <input
                  value={code79}
                  onChange={(e) => setCode79(e.target.value.toUpperCase())}
                  placeholder={t("promo.placeholder")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#4063bb] focus:outline-none focus:ring-2 focus:ring-[#4063bb]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  disabled={isPremium}
                />
                {code79 && !checkingPlan && (
                  <button
                    type="button"
                    onClick={() => setCode79("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => onApplyCode(code79, "monthly_79")}
                disabled={
                  !code79.trim() || checkingPlan === "monthly_79" || isPremium
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4063bb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-600 disabled:opacity-60"
              >
                {checkingPlan === "monthly_79" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BadgePercent className="h-4 w-4" />
                )}
                {t("promo.apply")}
              </button>
            </div>

            {promoErr.monthly_79 && (
              <p className="mb-2 text-xs font-medium text-red-600 dark:text-red-400">
                {promoErr.monthly_79}
              </p>
            )}
            {monthlyPromoActive && (
              <p className="mb-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {monthlyPriceAfterLabel}
              </p>
            )}

            <ul className="mb-6 space-y-3 text-sm text-slate-700 dark:text-slate-200">
              {premiumFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-sky-50 dark:bg-slate-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#4063bb] dark:text-sky-200" />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-1">
              <button
                type="button"
                onClick={() => handleUpgrade("monthly_79")}
                disabled={isPremium || loading}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60 ${
                  isPremium
                    ? "bg-emerald-600 hover:bg-emerald-600"
                    : "bg-[#4063bb] hover:bg-sky-600"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {processingLabel}
                  </>
                ) : isPremium ? (
                  <>
                    <Crown className="h-4 w-4" />
                    {currentPlanLabel}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {monthlyUpgradeLabel}
                  </>
                )}
              </button>
            </div>
          </motion.article>

          {/* PREMIUM 159k / 3 tháng – GÓI KHUYẾN NGHỊ */}
          <motion.article
            variants={cardFade}
            className="group relative order-2 flex h-full flex-col rounded-3xl border border-[#4063bb]/70 bg-white p-6 shadow-2xl shadow-[#4063bb4d] ring-1 ring-[#4063bb]/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl dark:border-sky-400/60 dark:bg-slate-900 sm:p-7 lg:order-3"
          >
            <div className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-emerald-950 shadow-sm dark:bg-emerald-300">
              {isPremium ? (
                <>
                  <Crown className="h-3.5 w-3.5" />
                  {t("plans.quarterly.badge.current")}
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  {t("plans.quarterly.badge.recommended")}
                </>
              )}
            </div>

            <div className="border-b border-slate-200 pb-6 mb-6 dark:border-slate-800">
              <div className="mx-auto">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4063bb] to-sky-500 shadow-lg shadow-[#4063bb4d] xs:h-10 xs:w-10">
                  <Crown className="h-5 w-5 text-white" />
                </div>
              </div>
              <h3 className="mt-5 text-center font-manrope text-xl font-bold text-[#4063bb] dark:text-sky-200">
                {t("plans.quarterly.name")}
              </h3>
              <div className="mt-3 flex items-center justify-center">
                {plusPromoActive ? (
                  <>
                    <span className="text-lg font-normal text-slate-400 line-through dark:text-slate-500">
                      {Math.round(plusPrice.base / 1000)}k
                    </span>
                    <span className="ml-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      {Math.round(plusPrice.final / 1000)}k
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {t("plans.quarterly.price")}
                  </span>
                )}
                <span className="ml-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {t("plans.period.quarter")}
                </span>
              </div>
              <p className="mt-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {t("plans.quarterly.highlight")}
              </p>
              <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
                {t("plans.quarterly.description")}
              </p>
              {plusPromoActive && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                  <BadgePercent className="h-3 w-3" />
                  {t("promo.applied", { code: promo?.code ?? "" })}
                </div>
              )}
            </div>

            {/* Promo input cho 159k */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <input
                  value={code159}
                  onChange={(e) => setCode159(e.target.value.toUpperCase())}
                  placeholder={t("promo.placeholder")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#4063bb] focus:outline-none focus:ring-2 focus:ring-[#4063bb]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  disabled={isPremium}
                />
                {code159 && !checkingPlan && (
                  <button
                    type="button"
                    onClick={() => setCode159("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => onApplyCode(code159, "monthly_159")}
                disabled={
                  !code159.trim() || checkingPlan === "monthly_159" || isPremium
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4063bb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-600 disabled:opacity-60"
              >
                {checkingPlan === "monthly_159" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BadgePercent className="h-4 w-4" />
                )}
                {t("promo.apply")}
              </button>
            </div>

            {promoErr.monthly_159 && (
              <p className="mb-2 text-xs font-medium text-red-600 dark:text-red-400">
                {promoErr.monthly_159}
              </p>
            )}
            {plusPromoActive && (
              <p className="mb-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {quarterlyPriceAfterLabel}
              </p>
            )}

            <ul className="mb-8 space-y-3 text-sm text-slate-700 dark:text-slate-200">
              {premiumPlusFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-sky-50 dark:bg-slate-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#4063bb] dark:text-sky-200" />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <button
                type="button"
                onClick={() => handleUpgrade("monthly_159")}
                disabled={isPremium || loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {processingLabel}
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4" />
                    {isPremium ? currentPlanLabel : quarterlyUpgradeLabel}
                  </>
                )}
              </button>
            </div>
          </motion.article>
        </motion.div>

        {/* So sánh chi tiết Free vs Premium */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="rounded-3xl border border-slate-200 bg-white px-4 py-6 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:px-6 sm:py-7"
        >
          <div className="mb-5 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4063bb] to-sky-500 text-white shadow-lg shadow-[#4063bb4d] xs:h-10 xs:w-10">
                  <BarChart3 className="h-4 w-4 xs:h-5 xs:w-5" />
                </div>

                <div className="flex-1 space-y-1">
                  <h4 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50 leading-snug sm:text-base">
                    {t("comparison.heading")}
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 xs:text-[13px]">
                    {t("comparison.description")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden text-sm text-slate-700 md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-4 dark:text-slate-200">
            <div className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("comparison.columns.feature")}
            </div>
            <div className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("comparison.columns.free")}
            </div>
            <div className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-[#4063bb] dark:text-sky-300">
              {t("comparison.columns.premium")}
            </div>

            {rows.map((row) => (
              <React.Fragment key={row.key}>
                <div className="border-t border-slate-200 py-3 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {row.icon}
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {row.label}
                    </span>
                  </div>
                  {row.description && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {row.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-center border-t border-slate-200 py-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  {row.free}
                </div>
                <div className="flex items-center justify-center border-t border-slate-200 py-3 text-xs font-semibold text-[#4063bb] dark:border-slate-800 dark:text-sky-300">
                  {row.pro}
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="space-y-4 text-sm text-slate-700 md:hidden dark:text-slate-200">
            {rows.map((row) => (
              <div
                key={row.key}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4063bb] to-sky-500 text-white shadow-lg shadow-[#4063bb4d]">
                    {row.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {row.label}
                    </p>
                    {row.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {row.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-white p-3 shadow-sm shadow-slate-900/5 dark:bg-slate-900">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t("comparison.columns.free")}
                    </p>
                    <div className="text-[13px] text-slate-700 dark:text-slate-200">
                      {row.free}
                    </div>
                  </div>
                  <div className="rounded-xl bg-sky-50 p-3 shadow-sm shadow-slate-900/5 dark:bg-sky-900/20">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#4063bb] dark:text-sky-200">
                      {t("comparison.columns.premium")}
                    </p>
                    <div className="text-[13px] font-semibold text-[#4063bb] dark:text-sky-100">
                      {row.pro}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA cuối */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href={`${basePrefix}/practice`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4063bb] focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950"
          >
            <PlayCircle className="h-4 w-4" />
            {t("cta.practice")}
          </Link>

          <button
            type="button"
            onClick={() => handleUpgrade("monthly_79")}
            disabled={isPremium || loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4063bb] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-600 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {processingLabel}
              </>
            ) : isPremium ? (
              <>
                <Crown className="h-4 w-4" />
                {currentPlanLabel}
              </>
            ) : (
              <>
                <Crown className="h-4 w-4" />
                {t("cta.upgrade")}
              </>
            )}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
