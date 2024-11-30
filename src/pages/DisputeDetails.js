import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { ChatInterface } from '../components/ChatInterface';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

const DisputeDetails = ({ currentUser }) => {
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { disputeId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDisputeDetails = async () => {
      try {
        const disputeDetails = await firebaseService.getDisputeById(disputeId);
        setDispute(disputeDetails);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchDisputeDetails();
  }, [disputeId]);

  const handleResolveDispute = async () => {
    try {
      await firebaseService.updateDisputeStatus(disputeId, 'Resolved');
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to resolve dispute');
    }
  };

  const handleRejectDispute = async () => {
    try {
      await firebaseService.updateDisputeStatus(disputeId, 'Rejected');
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to reject dispute');
    }
  };

  const handleClose = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="mr-4 hover:bg-gray-100 p-2 rounded-full"
        >
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">Dispute Details</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Order #{dispute.orderNumber}
          </h2>
          <span 
            className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${dispute.status === 'Open' 
                ? 'bg-yellow-100 text-yellow-800' 
                : dispute.status === 'Resolved'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
              }
            `}
          >
            {dispute.status}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Description:</p>
            <p className="font-medium">{dispute.description}</p>
          </div>
          <div>
            <p className="text-gray-600">Customer:</p>
            <p className="font-medium">{dispute.customerName}</p>
          </div>
        </div>

        {dispute.status === 'Open' && (
          <div className="mt-6 flex space-x-4">
            <button 
              onClick={handleResolveDispute}
              className="flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              <CheckCircle className="mr-2" /> Resolve Dispute
            </button>
            <button 
              onClick={handleRejectDispute}
              className="flex items-center text-red-500 border border-red-500 px-4 py-2 rounded hover:bg-red-50"
            >
              <XCircle className="mr-2" /> Reject Dispute
            </button>
          </div>
        )}
      </div>

      <ChatInterface 
        dispute={dispute} 
        currentUser={currentUser} 
        onClose={handleClose} 
        disableClose={true}
      />
    </div>
  );
};

export default DisputeDetails;