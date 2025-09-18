import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import React from 'react';
import { Bar, Doughnut, Line, Pie, Scatter } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Common chart options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
};

// Line Chart Component
interface LineChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      fill?: boolean;
    }[];
  };
  title?: string;
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ data, title, height = 300 }) => {
  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={data} options={options} />
    </div>
  );
};

// Bar Chart Component
interface BarChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }[];
  };
  title?: string;
  height?: number;
  horizontal?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({ data, title, height = 300, horizontal = false }) => {
  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !!title,
        text: title,
      },
    },
    indexAxis: horizontal ? 'y' as const : 'x' as const,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={data} options={options} />
    </div>
  );
};

// Doughnut Chart Component
interface DoughnutChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
    }[];
  };
  title?: string;
  height?: number;
  showLegend?: boolean;
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({ 
  data, 
  title, 
  height = 300, 
  showLegend = true 
}) => {
  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !!title,
        text: title,
      },
      legend: {
        display: showLegend,
        position: 'right' as const,
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Doughnut data={data} options={options} />
    </div>
  );
};

// Pie Chart Component
interface PieChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
    }[];
  };
  title?: string;
  height?: number;
  showLegend?: boolean;
}

export const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  title, 
  height = 300, 
  showLegend = true 
}) => {
  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !!title,
        text: title,
      },
      legend: {
        display: showLegend,
        position: 'right' as const,
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Pie data={data} options={options} />
    </div>
  );
};

// Scatter Chart Component
interface ScatterChartProps {
  data: {
    datasets: {
      label: string;
      data: { x: number; y: number }[];
      backgroundColor?: string;
      borderColor?: string;
    }[];
  };
  title?: string;
  height?: number;
}

export const ScatterChart: React.FC<ScatterChartProps> = ({ data, title, height = 300 }) => {
  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Scatter data={data} options={options} />
    </div>
  );
};

// Area Chart Component (using Line chart with fill)
interface AreaChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
    }[];
  };
  title?: string;
  height?: number;
}

export const AreaChart: React.FC<AreaChartProps> = ({ data, title, height = 300 }) => {
  const areaData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      fill: true,
      tension: 0.4,
    })),
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={areaData} options={options} />
    </div>
  );
};

// Multi-axis Chart Component
interface MultiAxisChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      yAxisID?: string;
      type?: 'line' | 'bar';
    }[];
  };
  title?: string;
  height?: number;
}

export const MultiAxisChart: React.FC<MultiAxisChartProps> = ({ data, title, height = 300 }) => {
  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={data} options={options} />
    </div>
  );
};

// Progress Chart Component (using Doughnut)
interface ProgressChartProps {
  value: number;
  max: number;
  title?: string;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ 
  value, 
  max, 
  title, 
  height = 200,
  color = '#3B82F6',
  backgroundColor = '#E5E7EB'
}) => {
  const percentage = (value / max) * 100;
  
  const data = {
    labels: ['Completed', 'Remaining'],
    datasets: [
      {
        data: [value, max - value],
        backgroundColor: [color, backgroundColor],
        borderColor: [color, backgroundColor],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: !!title,
        text: title,
      },
    },
    cutout: '75%',
  };

  return (
    <div style={{ height: `${height}px` }} className="relative">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{Math.round(percentage)}%</div>
          <div className="text-sm text-gray-600">{value} / {max}</div>
        </div>
      </div>
    </div>
  );
};

// Sparkline Chart Component (minimal line chart)
interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  showPoints?: boolean;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({ 
  data, 
  color = '#3B82F6', 
  height = 40,
  showPoints = false
}) => {
  const sparklineData = {
    labels: data.map((_, index) => index.toString()),
    datasets: [
      {
        data,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: showPoints ? 3 : 0,
        pointHoverRadius: showPoints ? 5 : 0,
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      point: {
        radius: showPoints ? 3 : 0,
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={sparklineData} options={options} />
    </div>
  );
};
