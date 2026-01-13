import { useState } from 'react';
import { DollarSign, CreditCard, Download, ArrowUpRight, ArrowDownLeft, Filter, Search, Check, X } from 'lucide-react';

const AdminFinancePage = () => {

    // Mock Transactions
    const transactions = [
        { id: 'TRX-9821', user: 'Konstantin K.', course: 'IELTS Masterclass', amount: 99, type: 'Payment', status: 'Completed', date: 'Oct 24, 2023', method: 'Credit Card' },
        { id: 'TRX-9822', user: 'Andrew Salgado', course: 'Widthdrawal', amount: 450, type: 'Payout', status: 'Pending', date: 'Oct 23, 2023', method: 'Bank Transfer' },
        { id: 'TRX-9823', user: 'Sarah Willis', course: 'Business English', amount: 49, type: 'Payment', status: 'Completed', date: 'Oct 23, 2023', method: 'Momo' },
        { id: 'TRX-9824', user: 'John Doe', course: 'Refund Request', amount: 99, type: 'Refund', status: 'Pending', date: 'Oct 22, 2023', method: 'Original Payment' },
        { id: 'TRX-9825', user: 'Minh Nguyen', course: 'TOEIC Intensive', amount: 79, type: 'Payment', status: 'Failed', date: 'Oct 21, 2023', method: 'Bank Transfer' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <DollarSign className="text-green-500" /> Finance & Payouts
            </h1>

            {/* Finance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-blue-100 text-sm font-medium mb-1">Total Revenue</div>
                        <div className="text-3xl font-bold">$124,500.00</div>
                        <div className="mt-4 flex items-center gap-2 text-sm bg-white/20 w-fit px-2 py-1 rounded-lg">
                            <ArrowUpRight size={14} /> +12.5% vs last month
                        </div>
                    </div>
                    <DollarSign size={120} className="absolute -right-6 -bottom-6 text-white/10" />
                </div>

                <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                            <ArrowDownLeft size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Pending Payouts</div>
                            <div className="text-xl font-bold">$4,250.00</div>
                        </div>
                    </div>
                    <button className="w-full py-2 bg-orange-50 text-orange-600 text-sm font-bold rounded-lg hover:bg-orange-100 transition-colors">
                        Process Payouts (8)
                    </button>
                </div>

                <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Refund Requests</div>
                            <div className="text-xl font-bold">$297.00</div>
                        </div>
                    </div>
                    <button className="w-full py-2 bg-red-50 text-red-600 text-sm font-bold rounded-lg hover:bg-red-100 transition-colors">
                        Review Requests (3)
                    </button>
                </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="font-bold text-lg">Recent Transactions</h2>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Search ID or User..." className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-black/20 rounded-lg text-sm outline-none" />
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-lg border border-transparent hover:border-gray-200">
                            <Filter size={18} className="text-gray-500" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg border border-transparent hover:border-gray-200 text-gray-500">
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-500">
                                <th className="p-4">Transaction ID</th>
                                <th className="p-4">User & Course</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                            {transactions.map(trx => (
                                <tr key={trx.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono text-xs opacity-70">{trx.id}</td>
                                    <td className="p-4">
                                        <div className="font-bold">{trx.user}</div>
                                        <div className="text-xs text-gray-500">{trx.course}</div>
                                    </td>
                                    <td className="p-4 opacity-80">{trx.date}</td>
                                    <td className="p-4">
                                        <div className={`font-bold ${trx.type === 'Payment' ? 'text-green-600' :
                                                trx.type === 'Refund' ? 'text-red-500' : 'text-orange-500'
                                            }`}>
                                            {trx.type === 'Payment' ? '+' : '-'}${trx.amount}
                                        </div>
                                        <div className="text-xs text-gray-400">{trx.method}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${trx.status === 'Completed' ? 'bg-green-100 text-green-600' :
                                                trx.status === 'Pending' ? 'bg-yellow-100 text-yellow-600' :
                                                    'bg-red-100 text-red-600'
                                            }`}>
                                            {trx.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {trx.status === 'Pending' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100" title="Approve">
                                                    <Check size={14} />
                                                </button>
                                                <button className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Reject">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminFinancePage;
