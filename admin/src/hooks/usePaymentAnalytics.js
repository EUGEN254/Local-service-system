// hooks/usePaymentAnalytics.js
import { useState, useCallback, useContext } from "react";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";

export const usePaymentAnalytics = () => {
  const { API_BASE } = useContext(AdminContext);
  const [paymentData, setPaymentData] = useState({
    summary: {
      totalRevenue: 0,
      totalTransactions: 0,
      uniqueCustomers: 0,
      averageTransactionValue: 0,
      successRate: 0,
    },
    monthlySummary: [],
    topCustomers: [],
    statusDistribution: [],
    dailyTrend: [],
    allTransactions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPaymentAnalytics = useCallback(
    async (startDate, endDate, groupBy = "month") => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (groupBy) params.append("groupBy", groupBy);

        const url = `${API_BASE}/api/payment-analytics?${params}`;
        
        console.log("🔍 Fetching payment analytics:", {
          url,
          startDate,
          endDate,
          groupBy,
          API_BASE
        });

        const response = await axios.get(url, {
          withCredentials: true
        });

        console.log("✅ Payment analytics response:", response.data);

        if (response.data.success && response.data.data) {
          console.log("📊 Setting payment data:", {
            summary: response.data.data.summary,
            monthlySummaryCount: response.data.data.monthlySummary?.length || 0,
            topCustomersCount: response.data.data.topCustomers?.length || 0,
            dailyTrendCount: response.data.data.dailyTrend?.length || 0,
          });
          setPaymentData(response.data.data);
          return response.data.data;
        } else {
          console.warn("⚠️ No payment data received from server");
          return paymentData;
        }
      } catch (err) {
        console.error("❌ Error fetching payment analytics:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url
        });
        setError(
          err.response?.data?.error || "Failed to fetch payment analytics",
        );
        // Keep existing data on error
        return paymentData;
      } finally {
        setLoading(false);
      }
    },
    [API_BASE],
  );

  return { paymentData, loading, error, fetchPaymentAnalytics };
};