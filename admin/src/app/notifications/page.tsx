"use client";

import React from "react";
import { Bell, Send, Users, User, CheckCircle, AlertTriangle, Info, Search } from "lucide-react";
import { useToast } from "@/components/common/ToastProvider";
import { adminSendNotification, adminListUsers } from "@/lib/apiClient";

export default function NotificationsPage() {
    const [message, setMessage] = React.useState("");
    const [link, setLink] = React.useState("");
    const [type, setType] = React.useState<"system" | "like" | "comment">("system");
    const [target, setTarget] = React.useState<"all" | "specific">("all");
    const [specificEmail, setSpecificEmail] = React.useState("");
    const [suggestions, setSuggestions] = React.useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const toast = useToast();

    // Debounce search for email suggestions
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (target === "specific" && specificEmail.trim().length >= 2) {
                // Nếu đã nhập xong đuôi @gmail.com thì ẩn gợi ý
                if (specificEmail.toLowerCase().endsWith("@gmail.com")) {
                    setShowSuggestions(false);
                    return;
                }

                try {
                    const res = await adminListUsers({ q: specificEmail, limit: 5 });
                    const emails = res.items.map(u => u.email).filter(e => e.toLowerCase().includes(specificEmail.toLowerCase()));
                    setSuggestions(emails);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Failed to fetch suggestions", error);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [specificEmail, target]);

    const handleSend = async () => {
        if (!message.trim()) {
            toast.error("Vui lòng nhập nội dung thông báo");
            return;
        }

        if (target === "specific" && !specificEmail.trim()) {
            toast.error("Vui lòng nhập Email người nhận");
            return;
        }

        try {
            setBusy(true);
            const emails = target === "specific" ? [specificEmail.trim()] : [];
            const sendToAll = target === "all";

            const res = await adminSendNotification({
                emails,
                sendToAll,
                message,
                link,
                type,
            });

            toast.success(`Đã gửi thành công cho ${res.count} người dùng`);
            setMessage("");
            setLink("");
            setSpecificEmail("");
            setSuggestions([]);
        } catch (error: any) {
            toast.error(error.message || "Lỗi khi gửi thông báo");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 min-h-screen space-y-4">
            <header className="bg-white rounded-xl shadow-lg p-4 border border-zinc-200">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-2 shadow-lg">
                        <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Hệ thống Thông báo</h1>
                        <p className="text-xs text-zinc-600 mt-0.5">Gửi thông báo đến người dùng ứng dụng</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden">
                        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                            <h2 className="text-base font-semibold text-zinc-800 flex items-center gap-2">
                                <Send className="w-4 h-4 text-indigo-600" />
                                Soạn thông báo mới
                            </h2>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Target Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-700">Gửi đến</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setTarget("all")}
                                        className={`relative p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${target === "all"
                                            ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                                            : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600"
                                            }`}
                                    >
                                        <div className={`p-2 rounded-full ${target === "all" ? "bg-indigo-200" : "bg-zinc-100"}`}>
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold">Tất cả người dùng</div>
                                            <div className="text-xs opacity-70">Gửi broadcast toàn hệ thống</div>
                                        </div>
                                        {target === "all" && (
                                            <div className="absolute top-3 right-3 text-indigo-600">
                                                <CheckCircle className="w-5 h-5" />
                                            </div>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setTarget("specific")}
                                        className={`relative p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${target === "specific"
                                            ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                                            : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600"
                                            }`}
                                    >
                                        <div className={`p-2 rounded-full ${target === "specific" ? "bg-indigo-200" : "bg-zinc-100"}`}>
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold">Người dùng cụ thể</div>
                                            <div className="text-xs opacity-70">Gửi theo Email</div>
                                        </div>
                                        {target === "specific" && (
                                            <div className="absolute top-3 right-3 text-indigo-600">
                                                <CheckCircle className="w-5 h-5" />
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Specific Email Input with Autocomplete */}
                            {target === "specific" && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 relative">
                                    <label className="text-sm font-medium text-zinc-700">Email người nhận</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={specificEmail}
                                            onChange={(e) => {
                                                setSpecificEmail(e.target.value);
                                                setShowSuggestions(true);
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                                            placeholder="Nhập email (ví dụ: user@example.com)"
                                            className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
                                        />
                                        <div className="absolute right-3 top-2.5 text-zinc-400">
                                            <Search className="w-5 h-5" />
                                        </div>
                                    </div>

                                    {/* Suggestions Dropdown */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-xl border border-zinc-200 max-h-60 overflow-auto">
                                            {suggestions.map((email, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        setSpecificEmail(email);
                                                        setShowSuggestions(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-sm text-zinc-700 transition-colors flex items-center gap-2"
                                                >
                                                    <User className="w-4 h-4 text-zinc-400" />
                                                    {email}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Message Content */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">Nội dung thông báo</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    placeholder="Nhập nội dung thông báo..."
                                    className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                />
                            </div>

                            {/* Link & Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">Đường dẫn (Optional)</label>
                                    <input
                                        type="text"
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">Loại thông báo</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as any)}
                                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    >
                                        <option value="system">Hệ thống (System)</option>
                                        <option value="like">Tương tác (Like)</option>
                                        <option value="comment">Bình luận (Comment)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setMessage("");
                                        setLink("");
                                        setSpecificEmail("");
                                        setSuggestions([]);
                                    }}
                                    disabled={busy}
                                    className="px-6 py-2.5 rounded-lg text-zinc-600 hover:bg-zinc-100 font-medium transition-colors"
                                >
                                    Xóa form
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={busy}
                                    className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {busy ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Đang gửi...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Gửi thông báo
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar / Info */}
                <div className="space-y-6">
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-blue-900">Lưu ý khi gửi</h3>
                                <ul className="mt-2 space-y-2 text-sm text-blue-800">
                                    <li>• Thông báo sẽ được gửi ngay lập tức qua Socket.IO nếu người dùng đang online.</li>
                                    <li>• Nếu gửi "Tất cả", hệ thống sẽ xử lý lần lượt từng người dùng.</li>
                                    <li>• Hãy kiểm tra kỹ nội dung trước khi gửi vì không thể thu hồi.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-amber-900">Hạn chế Spam</h3>
                                <p className="mt-2 text-sm text-amber-800">
                                    Tránh gửi quá nhiều thông báo trong thời gian ngắn để không làm phiền người dùng.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
