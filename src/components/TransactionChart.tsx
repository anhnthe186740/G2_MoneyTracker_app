import { useContext, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TransactionContext } from '../context/TransactionContext';

interface TransactionChartProps {
    userId: number;
}

export default function TransactionChart({ userId }: TransactionChartProps) {
    const transactionContext = useContext(TransactionContext);
    if (!transactionContext) {
        throw new Error('TransactionChart must be used within TransactionProvider');
    }

    const { transactions, getTransactions } = transactionContext;
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        getTransactions(userId);
    }, [userId, getTransactions]);

    useEffect(() => {
        if (transactions.length === 0) return;

        // Group transactions by month
        const monthlyData: { [key: string]: { income: number; expense: number } } = {};

        transactions.forEach((transaction) => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { income: 0, expense: 0 };
            }

            if (transaction.type === 'INCOME') {
                monthlyData[monthKey].income += transaction.amount;
            } else {
                monthlyData[monthKey].expense += transaction.amount;
            }
        });

        // Convert to array and format
        const formattedData = Object.keys(monthlyData)
            .sort()
            .slice(-6) // Last 6 months
            .map((monthKey) => {
                const [year, month] = monthKey.split('-');
                return {
                    month: `Tháng ${month}/${year}`,
                    'Thu nhập': monthlyData[monthKey].income,
                    'Chi tiêu': monthlyData[monthKey].expense,
                };
            });

        setChartData(formattedData);
    }, [transactions]);

    const formatCurrency = (value: number) => {
        return `${(value / 1000000).toFixed(1)}M`;
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Biểu đồ thu chi 6 tháng gần đây</h2>

            {chartData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    Chưa có dữ liệu giao dịch
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={formatCurrency} />
                        <Tooltip
                            formatter={(value: number) => `${value.toLocaleString('vi-VN')} ₫`}
                        />
                        <Legend />
                        <Bar dataKey="Thu nhập" fill="#2ecc71" />
                        <Bar dataKey="Chi tiêu" fill="#e74c3c" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
