import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

export default function SupplierRiskChart({ data }) {
  return (
    <div className="chart-canvas">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barSize={32} margin={{ top: 10, right: 20, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="4 6" stroke="#e2e8f0" />
          <XAxis
            dataKey="supplier"
            tick={{ fill: "#0f172a", fontSize: 11 }}
            tickFormatter={(value) => (value?.length > 12 ? `${value.slice(0, 12)}...` : value)}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fill: "#0f172a", fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [value, "Risk Score"]}
            labelFormatter={(label) => `Supplier: ${label}`}
            cursor={{ fill: "rgba(15, 23, 42, 0.06)" }}
            contentStyle={{
              background: "#0f172a",
              border: "none",
              borderRadius: 10,
              color: "#f8fafc",
              fontSize: 12
            }}
          />
          <Bar dataKey="riskScore" fill="#fb7185" radius={[10, 10, 6, 6]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
