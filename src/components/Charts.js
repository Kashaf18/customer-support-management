import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust this path as per your project

// Colors for PieChart
const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444'];

// Process disputes data for charts
const processDisputesData = (disputes) => {
  // For Pie Chart: Count by Status
  const statusCounts = disputes.reduce((acc, dispute) => {
    acc[dispute.status] = (acc[dispute.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts).map(([key, value]) => ({
    name: key,
    value,
  }));

  // For Bar Chart: Group by Month
  const trendCounts = disputes.reduce(
    (acc, dispute) => {
      const month = new Date(dispute.createdAt).toLocaleString('default', {
        month: 'short',
      });
      acc[month] = acc[month] || { newDisputes: 0, resolvedDisputes: 0 };

      if (dispute.status === 'Resolved') {
        acc[month].resolvedDisputes += 1;
      } else {
        acc[month].newDisputes += 1;
      }

      return acc;
    },
    {}
  );

  const trendData = Object.entries(trendCounts).map(([month, data]) => ({
    month,
    ...data,
  }));

  return { statusData, trendData };
};

// Fetch disputes data from Firestore
const fetchDisputesData = async () => {
  const disputeReportsRef = collection(db, 'disputeReports');
  const snapshot = await getDocs(disputeReportsRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Pie Chart Component
const DisputeStatusPieChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="loading-placeholder">Loading or No Data Available...</div>;
  }

  return (
    <div className="chart-container">
      <h3 className="chart-title">Dispute Status Distribution</h3>
      <PieChart width={400} height={400}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          dataKey="value"
          label
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </div>
  );
};

// Bar Chart Component
const DisputeTrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="loading-placeholder">Loading or No Data Available...</div>;
  }

  return (
    <div className="chart-container">
      <h3 className="chart-title">Dispute Trends</h3>
      <div className="flex items-center">
        <BarChart width={600} height={400} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="newDisputes" fill="#3B82F6" name="New Disputes" />
          <Bar dataKey="resolvedDisputes" fill="#10B981" name="Resolved Disputes" />
        </BarChart>
      </div>
    </div>
  );
};

export { DisputeStatusPieChart, DisputeTrendChart };