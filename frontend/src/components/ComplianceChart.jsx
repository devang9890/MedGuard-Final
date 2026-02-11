import { PieChart, Pie, Cell, Tooltip } from "recharts";

export default function ComplianceChart({ data }) {
  return (
    <PieChart width={400} height={300}>
      <Pie data={data} dataKey="value" outerRadius={100}>
        <Cell fill="#4CAF50" />
        <Cell fill="#FFC107" />
        <Cell fill="#F44336" />
      </Pie>
      <Tooltip />
    </PieChart>
  );
}
