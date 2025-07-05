// /src/components/admin/LoanStatusChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ReportStats } from '@/hooks/useLoanDataForReports.ts';

interface LoanStatusChartProps {
    data: ReportStats['loansByStatus'];
    onBarClick: (status: string) => void;
}

export const LoanStatusChart: React.FC<LoanStatusChartProps> = ({ data, onBarClick }) => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                    dataKey="value"
                    fill="#4CAF50"
                    name="Nº de Préstamos"
                    onClick={(payload) => onBarClick(payload.name)}
                    style={{ cursor: 'pointer' }}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};