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

// Colors for PieChart
const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444'];

// Static Data for Initialization
const initialStatusData = [
  { name: 'Open', value: 100 },
  { name: 'In Progress', value: 50 },
  { name: 'Resolved', value: 150 },
  { name: 'Closed', value: 30 },
];

const initialTrendData = [
  { month: 'Jan', newDisputes: 40, resolvedDisputes: 24 },
  { month: 'Feb', newDisputes: 30, resolvedDisputes: 22 },
  { month: 'Mar', newDisputes: 20, resolvedDisputes: 18 },
  { month: 'Apr', newDisputes: 27, resolvedDisputes: 25 },
  { month: 'May', newDisputes: 18, resolvedDisputes: 30 },
];

// Pie Chart Component
export const DisputeStatusPieChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>Loading or No Data Available...</div>;
  }

  return (
    <div className="chart-container">
      <h3 className="chart-title">Dispute Status Distribution</h3>
      <PieChart width={300} height={300}>
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
export const DisputeTrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>Loading or No Data Available...</div>;
  }

  return (
    <div className="chart-container">
      <h3 className="chart-title">Dispute Trends</h3>
      <BarChart
        width={500}
        height={300}
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="newDisputes" fill="#3B82F6" />
        <Bar dataKey="resolvedDisputes" fill="#10B981" />
      </BarChart>
    </div>
  );
};

// Loading Placeholder
const LoadingPlaceholder = () => (
  <div className="loading-placeholder">
    <p>Loading...</p>
  </div>
);

// Main Dashboard Component
export const Dashboard = ({ currentUser, disputes }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [statusData, setStatusData] = useState(initialStatusData);
  const [trendData, setTrendData] = useState(initialTrendData);

  useEffect(() => {
    // Simulate data fetching delay
    setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Set loading state for 2 seconds

    // Simulate data update after a delay (for example, after 5 seconds)
    setTimeout(() => {
      // Here, you would fetch new data for status and trends and update the charts
      setStatusData([
        { name: 'Open', value: 130 },
        { name: 'In Progress', value: 80 },
        { name: 'Resolved', value: 210 },
        { name: 'Closed', value: 60 },
      ]);
      setTrendData([
        { month: 'Jan', newDisputes: 45, resolvedDisputes: 30 },
        { month: 'Feb', newDisputes: 35, resolvedDisputes: 28 },
        { month: 'Mar', newDisputes: 25, resolvedDisputes: 22 },
        { month: 'Apr', newDisputes: 32, resolvedDisputes: 27 },
        { month: 'May', newDisputes: 20, resolvedDisputes: 35 },
      ]);
    }, 5000); // Simulating a data update after 5 seconds
  }, []);

  return (
    <div className="dashboard">
      <h1>Customer Support Dashboard</h1>
      <div className="charts-row">
        {isLoading ? (
          <>
            <LoadingPlaceholder />
            <LoadingPlaceholder />
            <LoadingPlaceholder />
          </>
        ) : (
          <>
            {/* Pass the statusData and trendData as props */}
            <DisputeStatusPieChart data={statusData} />
            <DisputeTrendChart data={trendData} />
            <div className="quick-stats">
              <h3>Quick Stats</h3>
              <ul>
                <li>Open Disputes: {statusData[0].value}</li>
                <li>Resolved Disputes: {statusData[2].value}</li>
                <li>New Disputes: {trendData.reduce((sum, d) => sum + d.newDisputes, 0)}</li>
                <li>Avg Resolution Time: 0.00 days</li>
                <li>Total Disputes: {disputes.length}</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Styles (CSS-in-JS or external stylesheet)
const styles = `
.dashboard {
  font-family: Arial, sans-serif;
  padding: 20px;
  background-color: #f9fafb;
}
h1 {
  text-align: center;
  margin-bottom: 20px;
}
.charts-row {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
}
.chart-container {
  flex: 1;
  max-width: 500px;
  background: #fff;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.chart-title {
  text-align: center;
  margin-bottom: 10px;
}
.quick-stats {
  max-width: 300px;
  background: #fff;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.quick-stats h3 {
  margin-bottom: 15px;
}
.quick-stats ul {
  list-style: none;
  padding: 0;
}
.quick-stats li {
  margin-bottom: 5px;
}
.loading-placeholder {
  width: 100%;
  height: 200px;
  background-color: #e0e0e0;
  text-align: center;
  line-height: 200px;
  font-size: 18px;
  color: #aaa;
}
`;

// Add CSS styles to the document head
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);
