import React from 'react';
import { X, ChevronDown, ChevronRight, Check, AlertCircle } from 'lucide-react';

interface ImportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    data: {
        itemsCount: number;
        stimuliCount: number;
        summary: Array<{
            part: string;
            level: number;
            test: number;
            itemsCount: number;
            stimuliCount: number;
            items: Array<{
                id: string;
                status: 'new' | 'update';
                question: string;
                answer: string;
                choices: number;
            }>;
            stimuli: Array<{
                id: string;
                status: 'new' | 'update';
                media: string;
            }>;
        }>;
    } | null;
    busy: boolean;
}

export default function ImportPreviewModal({ isOpen, onClose, onConfirm, data, busy }: ImportPreviewModalProps) {
    const [expandedTest, setExpandedTest] = React.useState<string | null>(null);
    const [activeTab, setActiveTab] = React.useState<'items' | 'stimuli'>('items');

    if (!isOpen || !data) return null;

    const toggleTest = (key: string) => {
        if (expandedTest === key) {
            setExpandedTest(null);
        } else {
            setExpandedTest(key);
            setActiveTab('items');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900">Xác nhận Import Excel</h2>
                        <p className="text-sm text-zinc-600 mt-1">
                            Tìm thấy <span className="font-semibold text-blue-600">{data.itemsCount} items</span> và <span className="font-semibold text-purple-600">{data.stimuliCount} stimuli</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                        <X className="h-5 w-5 text-zinc-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Left Sidebar: List of Tests */}
                    <div className="w-1/3 border-r border-zinc-200 overflow-y-auto bg-zinc-50">
                        {data.summary.map((test) => {
                            const key = `${test.part}-${test.level}-${test.test}`;
                            const isExpanded = expandedTest === key;
                            return (
                                <div
                                    key={key}
                                    onClick={() => toggleTest(key)}
                                    className={`p-4 border-b border-zinc-200 cursor-pointer transition-colors hover:bg-white ${isExpanded ? 'bg-white border-l-4 border-l-blue-500 shadow-sm' : 'border-l-4 border-l-transparent'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-zinc-800">
                                            {test.part} - Level {test.level} - Test {test.test}
                                        </span>
                                        {isExpanded ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
                                    </div>
                                    <div className="flex gap-3 text-xs">
                                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                                            {test.itemsCount} items
                                        </span>
                                        <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                                            {test.stimuliCount} stimuli
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Content: Details Table */}
                    <div className="w-2/3 flex flex-col bg-white">
                        {expandedTest ? (
                            <>
                                {/* Tabs */}
                                <div className="flex border-b border-zinc-200">
                                    <button
                                        onClick={() => setActiveTab('items')}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'items'
                                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                                : 'text-zinc-600 hover:bg-zinc-50'
                                            }`}
                                    >
                                        Items
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('stimuli')}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'stimuli'
                                                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                                                : 'text-zinc-600 hover:bg-zinc-50'
                                            }`}
                                    >
                                        Stimuli
                                    </button>
                                </div>

                                {/* Table Area */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {(() => {
                                        const test = data.summary.find(t => `${t.part}-${t.level}-${t.test}` === expandedTest);
                                        if (!test) return null;

                                        if (activeTab === 'items') {
                                            if (test.items.length === 0) return <div className="text-center text-zinc-500 py-8">Không có items</div>;
                                            return (
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 sticky top-0">
                                                        <tr>
                                                            <th className="px-4 py-3 rounded-tl-lg">Status</th>
                                                            <th className="px-4 py-3">ID</th>
                                                            <th className="px-4 py-3">Question / Stem</th>
                                                            <th className="px-4 py-3 rounded-tr-lg">Answer</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-100">
                                                        {test.items.map((item) => (
                                                            <tr key={item.id} className="hover:bg-zinc-50">
                                                                <td className="px-4 py-3">
                                                                    {item.status === 'new' ? (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                            New
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                                                            Update
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 font-mono text-xs text-zinc-600">{item.id}</td>
                                                                <td className="px-4 py-3 max-w-xs truncate" title={item.question}>
                                                                    {item.question || <span className="italic text-zinc-400">No content</span>}
                                                                </td>
                                                                <td className="px-4 py-3 font-bold text-zinc-700">{item.answer}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            );
                                        } else {
                                            if (test.stimuli.length === 0) return <div className="text-center text-zinc-500 py-8">Không có stimuli</div>;
                                            return (
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 sticky top-0">
                                                        <tr>
                                                            <th className="px-4 py-3 rounded-tl-lg">Status</th>
                                                            <th className="px-4 py-3">ID</th>
                                                            <th className="px-4 py-3 rounded-tr-lg">Media</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-100">
                                                        {test.stimuli.map((stim) => (
                                                            <tr key={stim.id} className="hover:bg-zinc-50">
                                                                <td className="px-4 py-3">
                                                                    {stim.status === 'new' ? (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                            New
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                                                            Update
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 font-mono text-xs text-zinc-600">{stim.id}</td>
                                                                <td className="px-4 py-3 text-zinc-600">{stim.media || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            );
                                        }
                                    })()}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8">
                                <AlertCircle className="h-12 w-12 mb-3 opacity-20" />
                                <p>Chọn một bài test bên trái để xem chi tiết</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="px-5 py-2.5 rounded-lg border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={busy}
                        className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
                    >
                        {busy ? 'Đang xử lý...' : (
                            <>
                                <Check className="h-4 w-4" />
                                Xác nhận Import
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
