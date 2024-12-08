import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { DisputeList } from './DisputeList';
import Spinner from './Spinner';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
  Label,
} from 'recharts';

// Status Colors
const STATUS_COLORS = {
  New: '#3B82F6', // Blue
  'In Progress': '#FFA07A', // Yellow
  Open: '#A78BFA', // Purple
  Escalated: '#EF4444', // Red
  Resolved: '#10B981', // Green
 
};

const formatDuration = (totalMinutes) => {
  if (totalMinutes < 60) {
    return `${Math.round(totalMinutes)} minutes`;
  } else if (totalMinutes < 1440) { // Less than a day
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours} hr ${minutes} min`;
  } else {
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.round((totalMinutes % 1440) / 60);
    return `${days} days ${hours} hrs`;
  }
};

export const QuickStats = ({ 
  statistics, 
  totalDisputes, 
  avgResolutionTime, 
  isLoading, 
  disputes 
}) => {
  const [calculatedAvgResolutionTime, setCalculatedAvgResolutionTime] = useState(avgResolutionTime);

  useEffect(() => {
    if (disputes && disputes.length > 0) {
      // Calculate average resolution time for resolved disputes
      const resolvedDisputes = disputes.filter(dispute => 
        dispute.status === 'Resolved' && 
        dispute.createdAt && 
        dispute.resolvedAt
      );

      const resolutionTimes = resolvedDisputes.map(dispute => {
        const createdAt = dispute.createdAt.toDate ? dispute.createdAt.toDate() : new Date(dispute.createdAt);
        const resolvedAt = dispute.resolvedAt.toDate ? dispute.resolvedAt.toDate() : new Date(dispute.resolvedAt);
        return (resolvedAt - createdAt) / (1000 * 60); // Convert milliseconds to minutes
      });

      const calculatedAvgTime = resolutionTimes.length > 0 
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length 
        : 0;

      setCalculatedAvgResolutionTime(calculatedAvgTime);
    }
  }, [disputes]);

  return (
    <div className="bg-white shadow-lg rounded-xl p-4 flex-1">
      <h2 className="text-xl font-bold text-center mb-4 text-gray-800">Quick Stats</h2>
      {isLoading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
            <span className="text-sm font-bold text-pink-700">Total Disputes</span>
            <span className="text-md font-bold text-gray-600">{totalDisputes}</span>
          </div>
          
        
          
          {Object.keys(STATUS_COLORS).map((key) => (
            <div
              key={key}
              className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
            >
              <span
                className="text-sm font-bold"
                style={{ color: STATUS_COLORS[key] || '#6B7280' }}
              >
                {key}
              </span>
              <span className="text-md font-bold text-gray-600">
                {statistics[key] || 0}
              </span>
            </div>
          ))}
        </div>
        
      )}
        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
            <span className="text-sm font-bold text-pink-400">Avg Resolution Time</span>
            <span className="text-md font-bold text-gray-600">
              {calculatedAvgResolutionTime > 0 
                ? formatDuration(calculatedAvgResolutionTime) 
                : '2 days'}
            </span>
          </div>
    </div>
  );
};


// Dispute Status Pie Chart
const DisputeStatusPieChart = ({ data }) => (
  <div className="bg-white shadow-lg rounded-xl p-4 flex-1">
    <h3 className="text-lg font-bold mb-4 text-center text-gray-800">Dispute Status Distribution</h3>
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#6B7280'} />
          ))}
        </Pie>
        <Tooltip />
        <Legend 
          layout="horizontal" 
          verticalAlign="bottom" 
          align="center"
          formatter={(value) => <span className="text-sm">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
);
const DisputeTrendChart = ({ data }) => {
  const allStatuses = Object.keys(STATUS_COLORS);

  return (
    <div className="bg-white shadow-lg rounded-xl p-4 flex-1">
      <h3 className="text-lg font-bold mb-4 text-center text-gray-800">Monthly Dispute Trends</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 20, right: -2, left: -18, bottom: 5 }} // Increased bottom margin for spacing
        >
          <XAxis dataKey="Months">
            <Label value="Months" offset={5} position="insideBottom"  fontSize= '14px' fontWeight = '500' />
          </XAxis>
          <YAxis
            label={{
              value: 'Dispute Count',
              angle: -90,
              position: 'insideLeft',
              dy: 50, // Centered label along the Y-axis
              dx: 22,
              style: { fontSize: '14px', fontWeight: 500 },
            }}
          />
          <Tooltip />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ marginTop: '20px',paddingBottom: '-20px' }} // Adds space between chart and legend
            formatter={(value) => <span className="text-sm">{value}</span>}
            
          />
          {allStatuses.map((status) => (
            <Bar key={status} dataKey={status} fill={STATUS_COLORS[status]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};



// Dashboard Component
export const Dashboard = ({ currentUser }) => {
  const [disputes, setDisputes] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [statistics, setStatistics] = useState({
    New: 0,
    Open: 0,
    'In Progress': 0,
    Resolved: 0,
    Escalated: 0,
  });
  const [totalDisputes, setTotalDisputes] = useState(0);
  const [avgResolutionTime, setAvgResolutionTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const userName = currentUser?.displayName || 'User';
  const userAvatar = currentUser?.photoURL || '/default-avatar.png';
  useEffect(() => {
    const loadData = async () => {
      try {
        const disputeReportsRef = collection(db, 'disputeReports');
        const snapshot = await getDocs(disputeReportsRef);
        const fetchedDisputes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          status: doc.data().status || 'New',
        }));
        setDisputes(fetchedDisputes);

        const statusCounts = Object.keys(STATUS_COLORS).reduce((acc, status) => {
          acc[status] = fetchedDisputes.filter(dispute => dispute.status === status).length;
          return acc;
        }, {});

        const processedStatusData = Object.entries(statusCounts).map(([key, value]) => ({
          name: key,
          value,
        }));

        const trendCounts = fetchedDisputes.reduce((acc, dispute) => {
          const month = new Date(dispute.createdAt).toLocaleString('default', { month: 'short' });
          acc[month] = acc[month] || {};
          Object.keys(STATUS_COLORS).forEach((status) => {
            acc[month][status] = (acc[month][status] || 0) + (dispute.status === status ? 1 : 0);
          });
          return acc;
        }, {});

        const processedTrendData = Object.entries(trendCounts).map(([month, data]) => ({
          month,
          ...data,
        }));

        
         
          

        setStatistics(statusCounts);
        setStatusData(processedStatusData);
        setTrendData(processedTrendData);
        setTotalDisputes(fetchedDisputes.length);
       
      } catch (error) {
        console.error('Error fetching dispute data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);


  // Handle updating dispute status (both locally and in Firestore)
  const handleUpdateStatus = async (disputeId, newStatus) => {
    try {
      // Update Firestore document
      const disputeRef = doc(db, 'disputeReports', disputeId);
      await updateDoc(disputeRef, { status: newStatus });

      // Update local state
      const updatedDisputes = disputes.map(d => 
        d.id === disputeId ? { ...d, status: newStatus } : d
      );
      setDisputes(updatedDisputes);

      // Recalculate status counts using the entire updated disputes array
      const statusCounts = Object.keys(STATUS_COLORS).reduce((acc, status) => {
        acc[status] = updatedDisputes.filter(dispute => dispute.status === status).length;
        return acc;
      }, {});

      // Update statistics and status data
      setStatistics(statusCounts);
      
      const processedStatusData = Object.entries(statusCounts).map(([key, value]) => ({
        name: key,
        value,
      }));
      setStatusData(processedStatusData);

      // Recalculate trend data if needed
      const trendCounts = updatedDisputes.reduce((acc, dispute) => {
        const month = new Date(dispute.createdAt).toLocaleString('default', { month: 'short' });
        acc[month] = acc[month] || {};
        Object.keys(STATUS_COLORS).forEach((status) => {
          acc[month][status] = (acc[month][status] || 0) + (dispute.status === status ? 1 : 0);
        });
        return acc;
      }, {});

      const processedTrendData = Object.entries(trendCounts).map(([month, data]) => ({
        month,
        ...data,
      }));
      setTrendData(processedTrendData);

    } catch (error) {
      console.error('Error updating dispute status:', error);
    }
  };

  
  return (
    <div className="container mx-auto p-6 bg-gray-50">
    <div className="flex justify-between items-center mb-10">
     
      <h1 className="text-3xl font-bold text-orange-500 text-center flex-grow text-center">
        Customer Support Dashboard
      </h1>
      
  
      <div className="bg-orange-500 text-white font-medium flex items-center justify-center w-10 h-10 rounded-full ml-4">
        CS
      </div>
    </div>
  
  

      <div className="flex flex-wrap gap-6 mb-8">
      <DisputeStatusPieChart data={statusData} />
      <QuickStats
        statistics={statistics}
        totalDisputes={totalDisputes}
        disputes={disputes}
        isLoading={isLoading}
        avgResolutionTime={avgResolutionTime}
      />
    
      <DisputeTrendChart data={trendData} />
    </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center items-center">
            <Spinner size={24} color="#4A90E2" />
          </div>
        ) : (
          <DisputeList
            currentUser={currentUser}
            disputes={disputes}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </div>
    </div>
  );
};