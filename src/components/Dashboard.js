import React, { useState, useEffect, useMemo } from 'react';
import { DisputeStatusPieChart, DisputeTrendChart } from './Charts'; // Import individual charts
import { DisputeList } from './DisputeList';
import { firebaseService } from '../services/firebaseService';
import Spinner from './Spinner'; // Spinner component

const QuickStats = ({ statistics, isLoading }) => {
  const getStatColor = (key) => {
    switch (key) {
      case 'openDisputes':
        return 'text-yellow-600';
      case 'resolvedDisputes':
        return 'text-green-600';
      case 'newDisputes':
        return 'text-blue-600';
      case 'averageResolutionTime':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
      {isLoading ? (
        <div className="text-center text-gray-500">Loading statistics...</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(statistics).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-600">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className={`font-bold ${getStatColor(key)}`}>
                {key === 'averageResolutionTime' ? `${value.toFixed(2)} days` : value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const Dashboard = ({ currentUser }) => {
  const [disputes, setDisputes] = useState([]);
  const [statistics, setStatistics] = useState({
    totalDisputes: 0,
    openDisputes: 0,
    resolvedDisputes: 0,
    newDisputes: 0,
    averageResolutionTime: 0,
  });
  const [disputesLoading, setDisputesLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const userName = currentUser?.displayName || 'User';
  const userAvatar = currentUser?.photoURL || '/default-avatar.png';

  useEffect(() => {
    // Real-time disputes listener
    const unsubscribe = firebaseService.fetchDisputes(
      (fetchedDisputes) => {
        setDisputes(fetchedDisputes);
        setDisputesLoading(false);
      },
      (error) => {
        console.error('Error fetching disputes:', error);
        setDisputesLoading(false);
      }
    );

    // Fetch dispute statistics
    const fetchStatistics = async () => {
      try {
        const stats = await firebaseService.getDisputeStatistics();
        setStatistics(stats);
        setStatsLoading(false);
      } catch (error) {
        console.error('Failed to fetch statistics', error);
        setStatsLoading(false);
      }
    };

    fetchStatistics();

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Memoized statistics derived from disputes
  const quickStats = useMemo(() => {
    const openDisputes = disputes.filter((d) => d.status === 'open').length;
    const resolvedDisputes = disputes.filter((d) => d.status === 'resolved').length;
    const totalDisputes = disputes.length;

    return {
      openDisputes,
      resolvedDisputes,
      totalDisputes,
    };
  }, [disputes]);

  // Handle updating dispute status
  const handleUpdateStatus = (disputeId, newStatus) => {
    firebaseService.updateDisputeStatus(disputeId, newStatus)
      .then(() => {
        setDisputes(prevDisputes => 
          prevDisputes.map(d =>
            d.id === disputeId ? { ...d, status: newStatus } : d
          )
        );
      })
      .catch((error) => {
        console.error('Error updating dispute status:', error);
      });
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customer Support Dashboard</h1>
        <div className="flex items-center space-x-4">
          <img
            src={userAvatar}
            alt="User Avatar"
            className="w-10 h-10 rounded-full"
            aria-label={`Profile picture of ${userName}`}
          />
          <span className="font-medium">{userName}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="md:col-span-2">
          {disputesLoading ? (
            <div className="text-center text-gray-500">Loading disputes...</div>
          ) : (
            <>
              <DisputeStatusPieChart disputes={disputes} />
              <DisputeTrendChart disputes={disputes} />
            </>
          )}
        </div>

        {/* Quick Stats Section */}
        <div className="md:col-span-1">
          <QuickStats statistics={{ ...statistics, ...quickStats }} isLoading={statsLoading} />
        </div>
      </div>

      {/* Dispute List */}
      <div className="mt-8">
        {disputesLoading ? (
          <div className="flex justify-center items-center">
            <Spinner size={24} color="#4A90E2" />
          </div>
        ) : (
          <DisputeList
            currentUser={currentUser}
            disputes={disputes}
            onUpdateStatus={handleUpdateStatus} // Pass the function to update status
          />
        )}
      </div>
    </div>
  );
};
