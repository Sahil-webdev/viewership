import React from 'react';
import { motion } from 'framer-motion';
import { ViewRecord } from '../types/index';

interface LineChartProps {
  videos: Array<{ id: string; title: string; viewHistory: ViewRecord[] }>;
  height?: number;
  showLegend?: boolean;
}

const COLORS = ['#FF0033', '#6366F1', '#10B981', '#F59E0B', '#8B5CF6'];

const LineChart: React.FC<LineChartProps> = ({ videos, height = 340, showLegend = true }) => {
  const preparedVideos = videos
    .map((video) => {
      const byDate = new Map<string, ViewRecord>();
      for (const record of video.viewHistory) {
        // Keep latest entry per day if duplicate dates exist.
        byDate.set(record.date, record);
      }
      const cleanedHistory = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
      return { ...video, viewHistory: cleanedHistory };
    })
    .filter(v => v.viewHistory.length > 0);
  
  if (preparedVideos.length === 0) {
    return (
      <div className="flex items-center justify-center h-[340px] bg-white rounded-2xl border border-slate-200">
        <div className="text-center">
          <div className="text-4xl mb-3">📈</div>
          <p className="text-slate-500">No view data available yet. Track your videos to see trends.</p>
        </div>
      </div>
    );
  }

  const allDates = Array.from(new Set(
    preparedVideos.flatMap(v => v.viewHistory.map(d => d.date))
  )).sort();
  const dateToIndex = new Map(allDates.map((date, index) => [date, index]));

  const maxViews = Math.max(...preparedVideos.flatMap(v => v.viewHistory.map(d => d.views)));
  const minViews = Math.min(...preparedVideos.flatMap(v => v.viewHistory.map(d => d.views)));
  const range = maxViews - minViews || 1;

  const width = 800;
  const padding = { top: 30, right: 40, bottom: 50, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => padding.left + (index / (allDates.length - 1 || 1)) * chartWidth;
  const getY = (views: number) => padding.top + ((maxViews - views) / range) * chartHeight;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 overflow-hidden shadow-sm">
      {showLegend && (
        <div className="flex flex-wrap gap-4 mb-6">
          {preparedVideos.map((video, idx) => (
            <div key={video.id} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-slate-600 truncate max-w-[200px]">{video.title}</span>
            </div>
          ))}
        </div>
      )}

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid Lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + (chartHeight * i) / 4}
            x2={width - padding.right}
            y2={padding.top + (chartHeight * i) / 4}
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ))}

        {/* Y Axis Labels */}
        {[0, 1, 2, 3, 4].map(i => {
          const val = Math.round(maxViews - (range * i) / 4);
          return (
            <text
              key={i}
              x={padding.left - 12}
              y={padding.top + (chartHeight * i) / 4 + 5}
              fill="#64748b"
              fontSize="11"
              textAnchor="end"
            >
              {val.toLocaleString()}
            </text>
          );
        })}

        {/* X Axis Labels - Show every 5th date */}
        {allDates.map((date, index) => {
          if (index % 5 !== 0 && index !== allDates.length - 1) return null;
          const [_, month, day] = date.split('-');
          return (
            <text
              key={index}
              x={getX(index)}
              y={height - 18}
              fill="#64748b"
              fontSize="10"
              textAnchor="middle"
            >
              {month}/{day}
            </text>
          );
        })}

        {/* Lines and Points for each video */}
        {preparedVideos.map((video, vIndex) => {
          const color = COLORS[vIndex % COLORS.length];
          const points = video.viewHistory.map((record, idx) => {
            const dateIndex = dateToIndex.get(record.date) ?? idx;
            return `${getX(dateIndex)},${getY(record.views)}`;
          }).join(' ');

          return (
            <g key={video.id}>
              {/* Animated Line */}
              <motion.polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0.3 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: vIndex * 0.15 }}
              />
              
              {/* Data Points */}
              {video.viewHistory.map((record, idx) => {
                const dateIndex = dateToIndex.get(record.date) ?? idx;
                const x = getX(dateIndex);
                const y = getY(record.views);
                return (
                  <g key={idx}>
                    <motion.circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth="2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.1 + vIndex * 0.1 }}
                    />
                    <circle cx={x} cy={y} r="10" fill="transparent" className="hover:fill-slate-100" />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* X Axis */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#475569"
          strokeWidth="1.5"
        />
        {/* Y Axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#475569"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};

export default LineChart;
