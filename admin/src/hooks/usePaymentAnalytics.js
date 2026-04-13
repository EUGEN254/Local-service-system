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
    customerTransactions: [],
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

        const response = await axios.get(
          `${API_BASE}/api/payment-analytics?${params}`,
          { withCredentials: true }
        );

        if (response.data.success && response.data.data) {
          setPaymentData(response.data.data);
          return response.data.data;
        }
        return paymentData;
      } catch (err) {
        console.error("Error fetching payment analytics:", err.message);
        setError(err.response?.data?.error || "Failed to fetch payment analytics");
        return paymentData;
      } finally {
        setLoading(false);
      }
    },
    [API_BASE]
  );

  return { paymentData, loading, error, fetchPaymentAnalytics };
};