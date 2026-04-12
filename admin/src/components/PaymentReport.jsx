// components/PaymentReport.jsx
import React, { useRef, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { HiDownload, HiCurrencyDollar, HiUsers, HiReceiptTax, HiTrendingUp } from 'react-icons/hi';
import { usePaymentAnalytics } from '../hooks/usePaymentAnalytics';

const PaymentReport = () => {
  const reportRef = useRef();
  const { paymentData, loading, fetchPaymentAnalytics } = usePaymentAnalytics();
  const [groupBy, setGroupBy] = useState('month');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    // Fetch all payment data without date filters
    fetchPaymentAnalytics(null, null, groupBy);
  }, [groupBy, fetchPaymentAnalytics]);

  const generateEnhancedPDF = async () => {
    if (!reportRef.current || isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    
    try {
      // Dynamically import libraries
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const element = reportRef.current;
      const clone = element.cloneNode(true);
      
      // Apply PDF-specific styles
      clone.style.backgroundColor = '#ffffff';
      clone.classList.add('pdf-export');
      
      // Fix any color issues
      const allElements = clone.getElementsByTagName('*');
      Array.from(allElements).forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        
        if (computedStyle.backgroundColor?.includes('oklch')) {
          el.style.backgroundColor = '#ffffff';
        }
        if (computedStyle.color?.includes('oklch')) {
          el.style.color = '#000000';
        }
      });
      
      // Append clone to body temporarily
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = element.offsetWidth + 'px';
      document.body.appendChild(clone);
      
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(clone, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const imgWidth = 190;
      const pageHeight = 277;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Add page numbers
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(
          `Page ${i} of ${totalPages} • Generated on ${new Date().toLocaleString()}`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }
      
      pdf.save(`payment-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Fallback to simple PDF
      try {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF();
        
        pdf.setFontSize(20);
        pdf.setTextColor(59, 130, 246);
        pdf.text('Payment Report', 105, 20, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.setTextColor(100);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
        
        let yPos = 50;
        const summary = paymentData?.summary || {};
        
        pdf.setFontSize(14);
        pdf.setTextColor(0);
        pdf.text('Summary', 20, yPos);
        yPos += 10;
        
        pdf.setFontSize(10);
        pdf.text(`Total Revenue: KSh ${(summary.totalRevenue || 0).toLocaleString()}`, 25, yPos);
        yPos += 6;
        pdf.text(`Total Transactions: ${summary.totalTransactions || 0}`, 25, yPos);
        yPos += 6;
        pdf.text(`Unique Customers: ${summary.uniqueCustomers || 0}`, 25, yPos);
        yPos += 6;
        pdf.text(`Average Transaction: KSh ${(summary.averageTransactionValue || 0).toFixed(2)}`, 25, yPos);
        
        pdf.save(`payment-report-simple-${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (fallbackError) {
        console.error('Fallback PDF failed:', fallbackError);
        alert('Error generating PDF report. Please try again.');
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-4 flex flex-wrap gap-4 items-end justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
        </div>
        <button
          onClick={generateEnhancedPDF}
          disabled={isGeneratingPDF}
          className={`text-white px-4 py-2 rounded-lg flex items-center gap-2 ${
            isGeneratingPDF ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isGeneratingPDF ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generating...
            </>
          ) : (
            <>
              <HiDownload /> Export PDF Report
            </>
          )}
        </button>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <HiCurrencyDollar className="text-3xl mb-2" />
            <p className="text-sm opacity-90">Total Revenue</p>
            <p className="text-2xl font-bold">KSh {paymentData?.summary?.totalRevenue?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <HiReceiptTax className="text-3xl mb-2" />
            <p className="text-sm opacity-90">Total Transactions</p>
            <p className="text-2xl font-bold">{paymentData?.summary?.totalTransactions || 0}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <HiUsers className="text-3xl mb-2" />
            <p className="text-sm opacity-90">Unique Customers</p>
            <p className="text-2xl font-bold">{paymentData?.summary?.uniqueCustomers || 0}</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <HiTrendingUp className="text-3xl mb-2" />
            <p className="text-sm opacity-90">Avg Transaction</p>
            <p className="text-2xl font-bold">KSh {paymentData?.summary?.averageTransactionValue?.toFixed(2) || 0}</p>
          </div>
        </div>

        {/* Monthly/Period Summary Chart */}
        <div className="payment-chart bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            {groupBy === 'month' ? 'Monthly' : groupBy === 'week' ? 'Weekly' : groupBy === 'day' ? 'Daily' : 'Yearly'} Payment Summary
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentData?.monthlySummary || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayPeriod" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value) => [`KSh ${value?.toLocaleString() || value}`, '']} />
              <Legend />
              <Bar yAxisId="left" dataKey="totalAmount" fill="#3B82F6" name="Revenue (KSh)" radius={[5, 5, 0, 0]} />
              <Bar yAxisId="right" dataKey="transactionCount" fill="#10B981" name="Transactions" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers */}
        <div className="payment-chart bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Top Paying Customers</h3>
          {paymentData?.topCustomers?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentData.topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="customerName" width={120} />
                <Tooltip formatter={(value) => [`KSh ${value?.toLocaleString() || value}`, 'Total Amount']} />
                <Bar dataKey="totalAmount" fill="#EC4899" name="Total Amount (KSh)" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No customer data available
            </div>
          )}
        </div>

        {/* Payment Status Distribution */}
        <div className="payment-chart bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Status Distribution</h3>
          {paymentData?.statusDistribution?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {paymentData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || ['#10B981', '#F59E0B', '#EF4444'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No status data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentReport;