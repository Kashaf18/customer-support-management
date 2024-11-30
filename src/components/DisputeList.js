import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { firebaseService } from '../services/firebaseService';

export const DisputeList = ({ disputes, onUpdateStatus, currentUser }) => {
  const navigate = useNavigate();
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Function to determine the background color based on the status
  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-blue-500',
      'In Progress': 'bg-yellow-500',
      'Resolved': 'bg-green-500',
      'Escalated': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
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
  const handleOpenChat = (dispute) => {
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

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4">Active Disputes</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Order Number</th>
              <th className="p-2 text-left">Nature of Dispute</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((dispute) => (
              <tr key={dispute.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{dispute.orderNumber}</td>
                <td className="p-2">{dispute.natureOfDispute}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded-full text-white text-xs ${getStatusColor(
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
                  >
                    <MessageSquare size={18} />
                  </button>
                  <select
                    value={dispute.status}
                    onChange={(e) => onUpdateStatus(dispute.id, e.target.value)}
                    className="border rounded p-1"
                  >
                    <option value="New">New</option>
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
    </>
  );
};

export default DisputeList;
