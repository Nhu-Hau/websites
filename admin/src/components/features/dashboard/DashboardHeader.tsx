import React from "react";

export default function DashboardHeader() {
    return (
        <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-zinc-200">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900">Dashboard Admin</h1>
                    <p className="text-xs text-zinc-600 mt-0.5">
                        Quản lý và theo dõi hiệu suất người dùng
                    </p>
                </div>
            </div>
        </div>
    );
}
