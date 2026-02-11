import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function SupplierRiskChart({ data }) {
  return (
    <BarChart width={500} height={300} data={data}>
      <XAxis dataKey="supplier" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="riskScore" fill="#ff4d4f" />
    </BarChart>
  );
}
