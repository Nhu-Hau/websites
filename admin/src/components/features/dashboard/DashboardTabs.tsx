import React from "react";

interface DashboardTabsProps {
    activeTab: 'overview' | 'placement' | 'progress' | 'practice' | 'toeic-pred';
    setActiveTab: (tab: 'overview' | 'placement' | 'progress' | 'practice' | 'toeic-pred') => void;
}

export default function DashboardTabs({ activeTab, setActiveTab }: DashboardTabsProps) {
    return (
        <div className="flex-shrink-0 border-b border-zinc-200 bg-white">
            <div className="flex gap-1 overflow-x-auto px-6">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'overview'
                            ? 'border-tealCustom text-tealCustom'
                            : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                        }`}
                >
                    Tổng quan
                </button>
                <button
                    onClick={() => setActiveTab('toeic-pred')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'toeic-pred'
                            ? 'border-tealCustom text-tealCustom'
                            : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                        }`}
                >
                    TOEIC Dự đoán
                </button>
                <button
                    onClick={() => setActiveTab('placement')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'placement'
                            ? 'border-tealCustom text-tealCustom'
                            : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                        }`}
                >
                    Placement
                </button>
                <button
                    onClick={() => setActiveTab('progress')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'progress'
                            ? 'border-tealCustom text-tealCustom'
                            : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                        }`}
                >
                    Progress
                </button>
                <button
                    onClick={() => setActiveTab('practice')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'practice'
                            ? 'border-tealCustom text-tealCustom'
                            : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                        }`}
                >
                    Practice
                </button>
            </div>
        </div>
    );
}
