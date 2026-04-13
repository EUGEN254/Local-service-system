import React, { useRef, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { usePaymentAnalytics } from "../hooks/usePaymentAnalytics";

const COLORS = {
  blue: "#378ADD",
  green: "#1D9E75",
  purple: "#534AB7",
};

const STATUS_COLORS = {
  completed: "#639922",
  pending: "#BA7517",
  failed: "#A32D2D",
};

const STATUS_BG = {
  completed: "#EAF3DE",
  pending: "#FAEEDA",
  failed: "#FCEBEB",
};

const s = {
  page: {
    padding: "1.5rem",
    background: "var(--color-background-tertiary, #F1EFE8)",
    minHeight: "100vh",
  },
  toolbar: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: "1.5rem",
  },
  pageTitle: { fontSize: 18, fontWeight: 500, margin: 0 },
  pageSub: { fontSize: 13, color: "#888780", marginTop: 2 },
  toolbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  selectWrap: { display: "flex", alignItems: "center", gap: 8 },
  selectLabel: { fontSize: 13, color: "#888780" },
  select: {
    fontSize: 13,
    padding: "6px 10px",
    borderRadius: 8,
    border: "0.5px solid rgba(0,0,0,0.2)",
    background: "var(--color-background-primary, #fff)",
    color: "var(--color-text-primary, #1a1a1a)",
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
    marginBottom: "1.25rem",
  },
  metricCard: {
    background: "var(--color-background-secondary, #F5F5F3)",
    borderRadius: 8,
    padding: "1rem 1.25rem",
  },
  metricLabel: {
    fontSize: 12,
    color: "#888780",
    marginBottom: 6,
    letterSpacing: "0.02em",
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 500,
    color: "var(--color-text-primary, #1a1a1a)",
  },
  badge: (variant) => ({
    display: "inline-block",
    marginTop: 4,
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 99,
    background: variant === "success" ? "#EAF3DE" : "#E6F1FB",
    color: variant === "success" ? "#3B6D11" : "#185FA5",
  }),
  chartCard: {
    background: "var(--color-background-primary, #fff)",
    border: "0.5px solid rgba(0,0,0,0.1)",
    borderRadius: 12,
    padding: "1.25rem 1.5rem",
  },
  chartHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.25rem",
  },
  chartTitle: { fontSize: 15, fontWeight: 500 },
  chartMeta: { fontSize: 12, color: "#888780" },
  legend: { display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    color: "#888780",
  },
  legendDot: (color) => ({
    width: 10,
    height: 10,
    borderRadius: 2,
    background: color,
    flexShrink: 0,
  }),
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" },
  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    color: "#888780",
    fontSize: 13,
  },
  exportBtn: (disabled) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 16px",
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 8,
    border: "0.5px solid rgba(0,0,0,0.2)",
    background: disabled
      ? "rgba(0,0,0,0.05)"
      : "var(--color-background-primary, #fff)",
    color: disabled ? "#888780" : "var(--color-text-primary, #1a1a1a)",
    cursor: disabled ? "not-allowed" : "pointer",
  }),
  // Added table container for horizontal scroll if needed
  tableContainer: {
    overflowX: "auto",
    width: "100%",
  },
  table: {
    minWidth: 800,
  },
};

const MetricCard = ({ label, value, badge, badgeVariant = "info" }) => (
  <div style={s.metricCard}>
    <p style={s.metricLabel}>{label}</p>
    <p style={s.metricValue}>{value}</p>
    {badge && <span style={s.badge(badgeVariant)}>{badge}</span>}
  </div>
);

const ChartCard = ({ title, meta, children, style = {} }) => (
  <div style={{ ...s.chartCard, ...style }}>
    <div style={s.chartHeader}>
      <span style={s.chartTitle}>{title}</span>
      {meta && <span style={s.chartMeta}>{meta}</span>}
    </div>
    {children}
  </div>
);

const LegendItem = ({ color, label }) => (
  <span style={s.legendItem}>
    <span style={s.legendDot(color)} />
    {label}
  </span>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--color-background-primary, #fff)",
        border: "0.5px solid rgba(0,0,0,0.12)",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 13,
      }}
    >
      <p style={{ fontWeight: 500, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill, margin: "2px 0" }}>
          {p.name}:{" "}
          {p.name.toLowerCase().includes("revenue") ||
          p.name.toLowerCase().includes("ksh")
            ? `KSh ${(p.value || 0).toLocaleString()}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

const PaymentReport = () => {
  const { paymentData, loading, fetchPaymentAnalytics } = usePaymentAnalytics();
  const [groupBy, setGroupBy] = useState("month");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchPaymentAnalytics(null, null, groupBy);
  }, [groupBy, fetchPaymentAnalytics]);

  const summary = paymentData?.summary || {};
  const periodLabel = {
    day: "Daily",
    week: "Weekly",
    month: "Monthly",
    year: "Yearly",
  }[groupBy];

  const generatePDF = async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);

    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "landscape", // Changed to landscape for better table fit
        unit: "mm",
        format: "a4",
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const contentW = pageW - margin * 2;
      let y = margin;

      const transactions = paymentData?.customerTransactions || [];

      const addFooter = () => {
        const current = pdf.internal.getCurrentPageInfo().pageNumber;
        const total = pdf.internal.getNumberOfPages();
        pdf.setFontSize(8);
        pdf.setTextColor(170, 170, 170);
        pdf.setFont(undefined, "normal");
        pdf.text(
          `Page ${current} of ${total}  ·  Generated ${new Date().toLocaleString()}  ·  Confidential`,
          pageW / 2,
          pageH - 6,
          { align: "center" },
        );
      };

      const checkPage = (needed = 10) => {
        if (y + needed > pageH - 16) {
          addFooter();
          pdf.addPage();
          y = margin;
          drawTableHeader();
        }
      };

      // ── HEADER BLOCK ───────────────────────────────────────
      pdf.setFillColor(245, 245, 243);
      pdf.roundedRect(margin, y, contentW, 22, 3, 3, "F");
      pdf.setFontSize(16);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(26, 26, 26);
      pdf.text("Payment Report", margin + 6, y + 9);
      pdf.setFontSize(9);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(136, 135, 128);
      pdf.text(
        `Generated: ${new Date().toLocaleString("en-KE")}  ·  ${transactions.length} transactions`,
        margin + 6,
        y + 16,
      );
      y += 28;

      // ── SUMMARY CARDS ──────────────────────────────────────
      const cards = [
        {
          label: "Total Revenue",
          value: `KSh ${(summary.totalRevenue || 0).toLocaleString()}`,
        },
        {
          label: "Transactions",
          value: String(summary.totalTransactions || 0),
        },
        {
          label: "Unique Customers",
          value: String(summary.uniqueCustomers || 0),
        },
        {
          label: "Success Rate",
          value: `${(summary.successRate || 0).toFixed(1)}%`,
        },
      ];
      const cardW = (contentW - 9) / 4;
      cards.forEach((card, i) => {
        const cx = margin + i * (cardW + 3);
        pdf.setFillColor(230, 241, 251);
        pdf.roundedRect(cx, y, cardW, 18, 2, 2, "F");
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 140, 180);
        pdf.setFont(undefined, "normal");
        pdf.text(card.label, cx + 4, y + 6);
        pdf.setFontSize(11);
        pdf.setFont(undefined, "bold");
        pdf.setTextColor(26, 26, 26);
        pdf.text(card.value, cx + 4, y + 14);
      });
      y += 24;

      // ── SECTION TITLE ──────────────────────────────────────
      pdf.setFontSize(10);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(26, 26, 26);
      pdf.text("Payment Transactions", margin, y);
      y += 6;

      // ── TABLE COLUMNS (Adjusted widths to fit properly) ────
      const cols = [
        { label: "#", key: "index", w: 8, align: "left" },
        { label: "Customer", key: "customerName", w: 34, align: "left" },
        { label: "Phone", key: "phone", w: 24, align: "left" },
        { label: "Service", key: "service", w: 26, align: "left" },
        { label: "Mode", key: "mode", w: 16, align: "left" },
        { label: "Ref", key: "transactionRef", w: 24, align: "left" },
        { label: "Amount", key: "amount", w: 20, align: "right" },
        { label: "Date", key: "date", w: 20, align: "left" },
        { label: "Status", key: "status", w: 24, align: "left" },
      ];

      const drawTableHeader = () => {
        pdf.setFillColor(26, 26, 26);
        pdf.rect(margin, y, contentW, 7, "F");
        pdf.setFontSize(7.5);
        pdf.setFont(undefined, "bold");
        pdf.setTextColor(255, 255, 255);
        let cx = margin + 2;
        cols.forEach((col) => {
          pdf.text(
            col.label,
            col.align === "right" ? cx + col.w - 2 : cx,
            y + 4.8,
            {
              align: col.align,
            },
          );
          cx += col.w;
        });
        y += 7;
      };

      drawTableHeader();

      // ── TABLE ROWS ─────────────────────────────────────────
      const ROW_H = 7;
      const statusFill = {
        completed: [234, 243, 222],
        pending: [250, 238, 218],
        failed: [252, 235, 235],
        unknown: [220, 220, 220],
      };
      const statusText = {
        completed: [59, 109, 17],
        pending: [99, 56, 6],
        failed: [121, 31, 31],
        unknown: [80, 80, 80],
      };

      transactions.forEach((row, i) => {
        checkPage(ROW_H + 2);

        if (i % 2 === 0) {
          pdf.setFillColor(250, 250, 249);
          pdf.rect(margin, y, contentW, ROW_H, "F");
        }

        pdf.setFontSize(7.5);
        pdf.setFont(undefined, "normal");

        let cx = margin + 2;
        cols.forEach((col) => {
          let val =
            col.key === "amount"
              ? `KSh ${(row[col.key] || 0).toLocaleString()}`
              : String(row[col.key] ?? "—");

          const maxChars = Math.floor(col.w / 1.6);
          if (val.length > maxChars) val = val.slice(0, maxChars - 1) + "…";

          if (col.key === "status") {
            const status = row.status || "unknown";
            pdf.setFontSize(7);
            pdf.setFont("helvetica", "bold");
            const pillW = pdf.getTextWidth(val) + 9;
            pdf.setFillColor(...(statusFill[status] || statusFill.unknown));
            pdf.roundedRect(cx, y + 1.8, pillW, 3.8, 1, 1, "F");
            pdf.setTextColor(...(statusText[status] || statusText.unknown));
            pdf.text(val, cx + 2, y + 4.8);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7.5);
          } else if (col.key === "mode") {
            pdf.setFillColor(230, 241, 251);
            pdf.roundedRect(cx, y + 1.5, 13, 4, 1, 1, "F");
            pdf.setTextColor(24, 95, 165);
            pdf.text(val, cx + 1, y + 4.8);
          } else if (col.key === "customerName") {
            pdf.setFont(undefined, "bold");
            pdf.setTextColor(26, 26, 26);
            pdf.text(val, cx, y + 4.8);
            pdf.setFont(undefined, "normal");
          } else {
            pdf.setTextColor(95, 94, 88);
            pdf.text(
              val,
              col.align === "right" ? cx + col.w - 2 : cx,
              y + 4.8,
              {
                align: col.align,
              },
            );
          }
          cx += col.w;
        });

        pdf.setDrawColor(235, 235, 233);
        pdf.line(margin, y + ROW_H, margin + contentW, y + ROW_H);
        y += ROW_H;
      });

      // ── TOTALS ROW ─────────────────────────────────────────
      checkPage(12);
      pdf.setFillColor(245, 245, 243);
      pdf.rect(margin, y, contentW, 8, "F");
      pdf.setFontSize(8);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(26, 26, 26);
      pdf.text("Total (completed payments)", margin + 2, y + 5.5);
      const completedTotal = transactions
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      pdf.text(
        `KSh ${completedTotal.toLocaleString()}`,
        margin + contentW - 2,
        y + 5.5,
        {
          align: "right",
        },
      );
      y += 12;

      addFooter();
      pdf.save(`payment-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 240,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "2px solid #e5e7eb",
            borderTopColor: "#378ADD",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Toolbar */}
      <div style={s.toolbar}>
        <div>
          <h2 style={s.pageTitle}>Payment report</h2>
          <p style={s.pageSub}>All-time performance overview</p>
        </div>
        <div style={s.toolbarRight}>
          <div style={s.selectWrap}>
            <label style={s.selectLabel}>Group by</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              style={s.select}
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
          <button
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            style={s.exportBtn(isGeneratingPDF)}
          >
            {isGeneratingPDF ? (
              <>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: "1.5px solid #ccc",
                    borderTopColor: "#888",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Generating…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 1v9M4 7l4 4 4-4M2 13h12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Metric cards */}
        <div style={s.metricGrid}>
          <MetricCard
            label="Total revenue"
            value={`KSh ${(summary.totalRevenue || 0).toLocaleString()}`}
            badge="All time"
            badgeVariant="info"
          />
          <MetricCard
            label="Transactions"
            value={(summary.totalTransactions || 0).toLocaleString()}
            badge="All statuses"
            badgeVariant="info"
          />
          <MetricCard
            label="Unique customers"
            value={(summary.uniqueCustomers || 0).toLocaleString()}
            badge="Verified payers"
            badgeVariant="success"
          />
          <MetricCard
            label="Avg. transaction"
            value={`KSh ${Math.round(summary.averageTransactionValue || 0).toLocaleString()}`}
            badge="Completed only"
            badgeVariant="success"
          />
        </div>

        {/* Bar chart */}
        <ChartCard
          title={`${periodLabel} payment summary`}
          meta={`${paymentData?.monthlySummary?.length || 0} periods`}
        >
          <div style={s.legend}>
            <LegendItem color={COLORS.blue} label="Revenue (KSh)" />
            <LegendItem color={COLORS.green} label="Transactions" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={paymentData?.monthlySummary || []} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(0,0,0,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="displayPeriod"
                tick={{ fontSize: 12, fill: "#888780" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: "#888780" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "#888780" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
              />
              <Bar
                yAxisId="left"
                dataKey="totalAmount"
                fill={COLORS.blue}
                name="Revenue (KSh)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                yAxisId="right"
                dataKey="transactionCount"
                fill={COLORS.green}
                name="Transactions"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bottom row */}
        <div style={s.twoCol}>
          <ChartCard
            title="Top customers"
            meta="By total amount"
            style={{ marginBottom: 0 }}
          >
            {paymentData?.topCustomers?.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={Math.max(
                  240,
                  paymentData.topCustomers.length * 44 + 60,
                )}
              >
                <BarChart
                  data={paymentData.topCustomers.slice(0, 8)}
                  layout="vertical"
                  barSize={14}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.06)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#888780" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="customerName"
                    width={110}
                    tick={{ fontSize: 12, fill: "#5F5E5A" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v) => [
                      `KSh ${(v || 0).toLocaleString()}`,
                      "Total amount",
                    ]}
                    contentStyle={{
                      fontSize: 13,
                      borderRadius: 8,
                      border: "0.5px solid rgba(0,0,0,0.1)",
                    }}
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  />
                  <Bar
                    dataKey="totalAmount"
                    fill={COLORS.purple}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={s.emptyState}>No customer data available</div>
            )}
          </ChartCard>

          <ChartCard
            title="Payment status"
            meta="Distribution"
            style={{ marginBottom: 0 }}
          >
            {paymentData?.statusDistribution?.length > 0 ? (
              <>
                <div style={s.legend}>
                  {paymentData.statusDistribution.map((entry, i) => {
                    const key = entry.name.toLowerCase();
                    const total = paymentData.statusDistribution.reduce(
                      (a, b) => a + b.count,
                      0,
                    );
                    return (
                      <LegendItem
                        key={i}
                        color={STATUS_COLORS[key] || "#888780"}
                        label={`${entry.name} ${total > 0 ? ((entry.count / total) * 100).toFixed(0) : 0}%`}
                      />
                    );
                  })}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={paymentData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="count"
                      paddingAngle={2}
                      label={false}
                    >
                      {paymentData.statusDistribution.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            STATUS_COLORS[entry.name.toLowerCase()] || "#888780"
                          }
                          strokeWidth={0}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [v, name]}
                      contentStyle={{
                        fontSize: 13,
                        borderRadius: 8,
                        border: "0.5px solid rgba(0,0,0,0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div style={s.emptyState}>No status data available</div>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default PaymentReport;