import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { faCommentDots } from '@fortawesome/free-regular-svg-icons';
import {  faImage, faTimes } from '@fortawesome/free-solid-svg-icons';
import { db } from '../firebaseConfig';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';

export const DisputeList = ({ disputes, onUpdateStatus, currentUser }) => {
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsDispute, setDetailsDispute] = useState(null);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Function to determine the background color based on the status
  const getStatusColor = (status) => {
    const colors = {
      New: 'bg-blue-500 text-white',
      Open: 'bg-purple-300 text-white',
      'In Progress': 'bg-yellow-500 text-white',
      Resolved: 'bg-green-500 text-white',
      Escalated: 'bg-red-500 text-white',
    };
    return colors[status] || 'bg-gray-500 text-white';
  };

  // Effect to fetch messages when a dispute is selected
  useEffect(() => {
    if (!selectedDispute) {
      setMessages([]);
      return;
    }

    // Set up real-time listener for the dispute's chat messages
    const unsubscribe = firebaseService.listenToDisputeMessages(
      selectedDispute.id, 
      (updatedMessages) => setMessages(updatedMessages), 
      (error) => console.error('Error listening to messages:', error)
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [selectedDispute]);

  // Handle opening chat for a specific dispute
  const handleOpenChat = async (dispute) => {
    // If dispute is in 'New' status, update it to 'Open'
    if (dispute.status === 'New') {
      try {
        // Update Firestore document
        const disputeRef = doc(db, 'disputeReports', dispute.id);
        await updateDoc(disputeRef, { status: 'Open' });

        // Call parent component's update status method
        onUpdateStatus(dispute.id, 'Open');
      } catch (error) {
        console.error('Error updating dispute status:', error);
      }
    }

    // Set selected dispute
    setSelectedDispute(dispute);
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!selectedDispute || !newMessage.trim()) return;

    try {
      await firebaseService.sendDisputeMessage(selectedDispute.id, {
        senderId: currentUser.uid || currentUser.id,
        message: newMessage.trim(),
        senderRole: currentUser.role || 'support',
        disputeId: selectedDispute.id
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Close the chat modal
  const handleCloseChat = () => {
    setSelectedDispute(null);
    setMessages([]);
  };

  // Function to open the "Dispute Details" modal
  const handleViewDetails = (dispute) => {
    setDetailsDispute(dispute);
    setIsDetailsModalOpen(true);
  };

  // Function to close the "Dispute Details" modal
  const handleCloseDetailsModal = () => {
    setDetailsDispute(null);
    setIsDetailsModalOpen(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-2xl text-center text-orange-500 font-bold mb-4">Active Disputes</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">User</th>
              <th className="p-2 text-left">Order Number</th>
              <th className="p-2 text-left">Nature of Dispute</th>
              <th className="p-2 text-left">Dispute Details</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Chat</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((dispute) => (
              <tr key={dispute.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{dispute.userName || 'Anonymous'}</td>
                <td className="p-2">{dispute.orderNumber}</td>
                <td className="p-2">{dispute.natureOfDispute}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleViewDetails(dispute)}
                    className="bg-blue-400 text-xs font-medium text-white w-24 h-6 flex items-center justify-center rounded-full hover:bg-blue-300"
                  >
                    View Details
                  </button>
                </td>
                <td className="p-2">
                  <span
                    className={`inline-block w-20 text-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      dispute.status
                    )}`}
                  >
                    {dispute.status}
                  </span>
                </td>
                <td className="p-2 flex space-x-2">
                  <button
                    onClick={() => handleOpenChat(dispute)}
                    className="text-blue-500 hover:bg-blue-100 p-2 rounded"
                    title={dispute.status === 'New' ? 'Initialize Chat' : 'Open Chat'}
                  >
                    <FontAwesomeIcon icon={faCommentDots} className="text-orange-500 h-6 w-6" />
                  </button>
                </td>
                
                <td className="p-2">
                  <select
                    value={dispute.status}
                    onChange={(e) => onUpdateStatus(dispute.id, e.target.value)}
                    className="border rounded p-1"
                  >
                    <option value="New">New</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chat Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-2/3 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">
                Chat for Order #{selectedDispute.orderNumber}
              </h2>
              <button onClick={handleCloseChat} className="text-red-500">Close</button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`mb-4 ${msg.senderId === (currentUser?.uid || currentUser?.id) 
                    ? 'text-right' 
                    : 'text-left'
                  }`}
                >
                  <div 
                    className={`inline-block p-2 rounded ${
                      msg.senderId === (currentUser?.uid || currentUser?.id)
                        ? 'bg-blue-100' 
                        : 'bg-gray-100'
                    }`}
                  >
                    <p className="text-sm">
                      <span className="font-semibold mr-2">
                        {msg.senderRole === 'support' ? 'Support' : 'Customer'}:
                      </span>
                      {msg.message}
                    </p>
                    <small className="text-gray-500 text-xs">
                      {msg.timestamp instanceof Date
                        ? msg.timestamp.toLocaleString()
                        : new Date(msg.timestamp).toLocaleString()}
                    </small>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center p-4 border-t">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                className="flex-grow border p-2 rounded mr-2"
                placeholder="Type your message..."
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Details Modal */}
      {isDetailsModalOpen && detailsDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-3/4 max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-2xl font-bold text-orange-600">Dispute Details</h2>
              <button 
                onClick={handleCloseDetailsModal} 
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Text Details */}
              <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">User Information</h3>
                  <p><strong>Name:</strong> {detailsDispute.userName || 'Anonymous'}</p>
                  <p><strong>Email:</strong> {detailsDispute.userEmail || 'Not provided'}</p>
                  <p><strong>User ID:</strong> {detailsDispute.userId || 'Not provided'}</p>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Dispute Details</h3>
                  <p><strong>Date:</strong> {detailsDispute.dateTime || 'Not provided'}</p>
                  <p><strong>Order Number:</strong> {detailsDispute.orderNumber}</p>
                  <p><strong>Nature of Dispute:</strong> {detailsDispute.natureOfDispute}</p>
                  <p><strong>Item Description:</strong> {detailsDispute.itemDescription || 'Not provided'}</p>
                  <p><strong>Extra Details:</strong> {detailsDispute.extraDetails || 'Not provided'}</p>
                  
                  <div className="mt-2">
                    <strong>Status:</strong>{' '}
                    <span 
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(detailsDispute.status)}`}
                    >
                      {detailsDispute.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column - Image */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  {detailsDispute.documentURL ? (
                    <img 
                      src={detailsDispute.documentURL} 
                      alt="Dispute Attachment" 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <FontAwesomeIcon icon={faImage} className="h-16 w-16 mb-4" />
                      <p className="text-center">No attachment available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DisputeList;