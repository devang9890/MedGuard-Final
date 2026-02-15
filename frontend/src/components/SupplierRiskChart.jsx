import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";

export default function SupplierRiskChart({ data }) {
  return (
    <div className="chart-canvas">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barSize={28} margin={{ top: 8, right: 16, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="4 6" stroke="var(--border-subtle)" />
          <XAxis
            dataKey="supplier"
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            tickFormatter={(v) => (v?.length > 10 ? `${v.slice(0, 10)}…` : v)}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={45}
          />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [value, "Risk Score"]}
            labelFormatter={(label) => `Supplier: ${label}`}
            cursor={{ fill: "rgba(59, 130, 246, 0.06)" }}
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 8,
              color: "#e5e7eb",
              fontSize: 12
            }}
          />
          <Bar dataKey="riskScore" fill="#fb7185" radius={[8, 8, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
