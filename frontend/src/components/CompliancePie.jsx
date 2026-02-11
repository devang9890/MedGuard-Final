import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function CompliancePie({ data }) {
  const chartData = [
    { name: "Accepted", value: data.accepted || 0 },
    { name: "Warning", value: data.warning || 0 },
    { name: "Rejected", value: data.rejected || 0 }
  ];

  return (
    <PieChart width={350} height={300}>
      <Pie data={chartData} dataKey="value" outerRadius={100}>
        <Cell fill="#4CAF50" />
        <Cell fill="#FFC107" />
        <Cell fill="#F44336" />
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}
