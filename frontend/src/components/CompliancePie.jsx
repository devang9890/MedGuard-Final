import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function CompliancePie({ data }) {
  const chartData = [
    { name: "Accepted", value: data.accepted || 0 },
    { name: "Warning", value: data.warnings || 0 },
    { name: "Rejected", value: data.rejected || 0 }
  ];

  return (
    <div className="chart-canvas">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
            cornerRadius={6}
            stroke="none"
            isAnimationActive
          >
            <Cell fill="#4ade80" />
            <Cell fill="#fbbf24" />
            <Cell fill="#f87171" />
          </Pie>
          <Tooltip
            formatter={(value, name) => [value, name]}
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 8,
              fontSize: 12,
              color: "#e5e7eb",
            }}
            itemStyle={{ color: "#e5e7eb" }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
