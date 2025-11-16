
// utils/chartUtils.ts
import { ChartOptions } from 'chart.js';

export const getPast12MonthsLabels = (): string[] => {
    const labels: string[] = [];
    const date = new Date();
    date.setDate(1); // Start from the first day of the current month

    for (let i = 0; i < 12; i++) {
        labels.push(date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }));
        date.setMonth(date.getMonth() - 1);
    }
    return labels.reverse();
};

export const chartColors = {
    blue: 'rgba(54, 162, 235, 0.6)',
    green: 'rgba(75, 192, 192, 0.6)',
    red: 'rgba(255, 99, 132, 0.6)',
    yellow: 'rgba(255, 206, 86, 0.6)',
    purple: 'rgba(153, 102, 255, 0.6)',
    orange: 'rgba(255, 159, 64, 0.6)',
};

export const commonChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top' as const,
        },
    },
};
