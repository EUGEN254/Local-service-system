import express from "express";
import mpesaTransactionsSchema from "../models/mpesaTransactionsSchema.js";
import Booking from "../models/bookingSchema.js";

const paymentAnalytics = express.Router();

paymentAnalytics.get("/", async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "month" } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + "T23:59:59.999Z"),
        },
      };
    }

    const mpesaTransactions = await mpesaTransactionsSchema
      .find(dateFilter)
      .populate("serviceId")
      .populate({
        path: "bookingId",
        populate: { path: "customer", select: "name email phone" },
      })
      .sort({ createdAt: -1 })
      .lean();

    const paidBookings = await Booking.find({ is_paid: true, ...dateFilter })
      .populate("customer", "name email phone")
      .populate("serviceId")
      .lean();

    if (mpesaTransactions.length === 0 && paidBookings.length === 0) {
      return res.json({
        success: true,
        data: {
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
        },
      });
    }

    const allPaymentRecords = [];

    mpesaTransactions.forEach((trans) => {
      allPaymentRecords.push({
        _id: trans._id,
        type: "mpesa",
        transactionId: trans.transactionId || trans._id.toString(),
        amount: trans.amount || 0,
        status: trans.status || "pending",
        createdAt: trans.createdAt,
        customer: trans.bookingId?.customer || { name: trans.customer || "Unknown" },
        customerId:
          trans.bookingId?.customer?._id?.toString() ||
          trans.customer ||
          "unknown",
        customerName:
          trans.bookingId?.customer?.name || trans.customer || "Unknown Customer",
        customerPhone:
          trans.bookingId?.customer?.phone || trans.phone || "—",
        customerEmail:
          trans.bookingId?.customer?.email || "—",
        service: trans.serviceId?.name || trans.serviceName || "N/A",
        bookingId: trans.bookingId?._id,
      });
    });

    const mpesaBookingIds = new Set(
      mpesaTransactions
        .map((t) => t.bookingId?._id?.toString())
        .filter(Boolean)
    );

    paidBookings.forEach((booking) => {
      if (!mpesaBookingIds.has(booking._id.toString())) {
        allPaymentRecords.push({
          _id: booking._id,
          type: "booking",
          transactionId: `BOOKING-${booking._id}`,
          amount: booking.amount || 0,
          status: "completed",
          createdAt: booking.createdAt,
          customer: booking.customer || { name: "Unknown Customer" },
          customerId: booking.customer?._id?.toString() || "unknown",
          customerName: booking.customer?.name || "Unknown Customer",
          customerPhone: booking.customer?.phone || "—",
          customerEmail: booking.customer?.email || "—",
          service: booking.serviceName || booking.categoryName || "N/A",
          bookingId: booking._id,
        });
      }
    });

    const completedPayments = allPaymentRecords.filter(
      (p) => p.status === "completed"
    );

    // Group by period
    const groupedPayments = {};
    completedPayments.forEach((payment) => {
      const date = new Date(payment.createdAt);
      let key, displayPeriod;

      if (groupBy === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        displayPeriod = date.toLocaleString("default", { month: "long", year: "numeric" });
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
        displayPeriod = `Week of ${weekStart.toLocaleDateString()}`;
      } else if (groupBy === "day") {
        key = date.toISOString().split("T")[0];
        displayPeriod = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else {
        key = date.getFullYear().toString();
        displayPeriod = date.getFullYear().toString();
      }

      if (!groupedPayments[key]) {
        groupedPayments[key] = {
          period: key,
          displayPeriod,
          totalAmount: 0,
          transactionCount: 0,
          uniqueCustomers: new Set(),
        };
      }

      groupedPayments[key].totalAmount += payment.amount || 0;
      groupedPayments[key].transactionCount++;
      if (payment.customerId && payment.customerId !== "unknown") {
        groupedPayments[key].uniqueCustomers.add(payment.customerId);
      }
    });

    const monthlySummary = Object.values(groupedPayments)
      .map((data) => ({
        period: data.period,
        displayPeriod: data.displayPeriod,
        totalAmount: data.totalAmount,
        transactionCount: data.transactionCount,
        uniqueCustomers: data.uniqueCustomers.size,
        averageAmount:
          data.transactionCount > 0 ? data.totalAmount / data.transactionCount : 0,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Top customers
    const customerPayments = {};
    completedPayments.forEach((payment) => {
      const id = payment.customerId;
      if (!customerPayments[id]) {
        customerPayments[id] = {
          customerId: id,
          customerName: payment.customerName,
          totalAmount: 0,
          transactionCount: 0,
          lastPayment: payment.createdAt,
        };
      }
      customerPayments[id].totalAmount += payment.amount || 0;
      customerPayments[id].transactionCount++;
    });

    const topCustomers = Object.values(customerPayments)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    // Status distribution
    const statusGroups = allPaymentRecords.reduce((acc, p) => {
      const status = p.status || "unknown";
      if (!acc[status]) acc[status] = { count: 0, totalAmount: 0 };
      acc[status].count++;
      acc[status].totalAmount += p.amount || 0;
      return acc;
    }, {});

    const statusDistribution = Object.entries(statusGroups).map(([status, data]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      count: data.count,
      totalAmount: data.totalAmount,
      color:
        status === "completed" ? "#10B981"
        : status === "pending" ? "#F59E0B"
        : "#EF4444",
    }));

    // Daily trend
    const dailyGroups = {};
    completedPayments.forEach((payment) => {
      const date = new Date(payment.createdAt).toISOString().split("T")[0];
      if (!dailyGroups[date]) dailyGroups[date] = { date, amount: 0, count: 0 };
      dailyGroups[date].amount += payment.amount || 0;
      dailyGroups[date].count++;
    });

    const dailyTrend = Object.values(dailyGroups).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Summary
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const uniqueCustomersSet = new Set(
      completedPayments.map((p) => p.customerId).filter((id) => id !== "unknown")
    );
    const completedCount = statusGroups["completed"]?.count || 0;
    const totalCount = allPaymentRecords.length;

    const summary = {
      totalRevenue,
      totalTransactions: totalCount,
      uniqueCustomers: uniqueCustomersSet.size,
      averageTransactionValue:
        completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0,
      successRate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
    };

    // Customer transactions list for PDF
    const customerTransactions = allPaymentRecords
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((p, index) => ({
        index: index + 1,
        customerName: p.customerName || "Unknown",
        phone: p.customerPhone || "—",
        email: p.customerEmail || "—",
        service: p.service || "—",
        mode: p.type === "mpesa" ? "M-Pesa" : "Booking",
        transactionRef: p.transactionId || "—",
        amount: p.amount || 0,
        status: p.status || "unknown",
        date: p.createdAt
          ? new Date(p.createdAt).toLocaleDateString("en-KE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
      }));

    res.json({
      success: true,
      data: {
        summary,
        monthlySummary,
        topCustomers,
        statusDistribution,
        dailyTrend,
        allTransactions: allPaymentRecords,
        customerTransactions,
      },
    });
  } catch (error) {
    console.error("❌ Error in payment analytics:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: {
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
      },
    });
  }
});

export default paymentAnalytics;