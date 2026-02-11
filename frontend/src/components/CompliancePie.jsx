import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function CompliancePie({ data }) {
  const chartData = [
    { name: "Accepted", value: data.accepted || 0 },
    { name: "Warning", value: data.warnings || 0 },
    { name: "Rejected", value: data.rejected || 0 }
  ];

  return (
    <div className="chart-canvas">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            innerRadius={62}
            outerRadius={110}
            paddingAngle={1}
            cornerRadius={8}
            stroke="#ffffff"
            strokeWidth={3}
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
              border: "none",
              borderRadius: 10,
              fontSize: 12
            }}
            labelStyle={{ color: "#f8fafc" }}
            itemStyle={{ color: "#f8fafc" }}
          />
          <Legend verticalAlign="bottom" iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
