import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';

export const ChatInterface = ({ onClose, currentUser }) => {
  const { id } = useParams();
  const location = useLocation();

  const { disputeId, customerName, orderNumber } = location.state || {};
  const chatId = id || disputeId;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!chatId) {
      setError('No chat ID available');
      setIsLoading(false);
      return;
    }
  
    let unsubscribe;
    const loadMessages = async () => {
      try {
        const initialMessages = await firebaseService.fetchDisputeMessages(chatId);
        console.log('Initial messages:', initialMessages); // Log messages
        setMessages(initialMessages);
        setIsLoading(false);
  
        unsubscribe = firebaseService.listenToDisputeMessages(
          chatId,
          (updatedMessages) => {
            console.log('Updated messages:', updatedMessages); // Log updated messages
            setMessages(updatedMessages);
          },
          (err) => {
            console.error('Error in message listener:', err);
            setError('Failed to listen to messages');
          }
        );
      } catch (error) {
        console.error('Error loading messages:', error);
        setError('Failed to load messages');
        setIsLoading(false);
      }
    };
  
    loadMessages();
  
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [chatId]);
  
  const renderMessage = (msg) => {
    const isOwnMessage = msg.senderId === currentUser?.uid;
  
    return (
      <div
        key={msg.id}
        className={`mb-4 ${isOwnMessage ? 'text-right' : 'text-left'}`}
      >
        <div
          className={`inline-block p-2 rounded ${
            isOwnMessage ? 'bg-blue-100' : 'bg-gray-100'
          }`}
        >
          {/* Text message */}
          {msg.message && (
            <p className="text-sm">
              <span className="font-semibold mr-2">
                {isOwnMessage ? 'You' : msg.senderName || 'Customer'}:
              </span>
              {msg.message}
            </p>
          )}
  
          {/* File preview */}
          {msg.fileURL && (
            <div className="file-preview mt-2">
              {msg.fileType?.startsWith('image/') ? (
                <img
                  src={msg.fileURL}
                  alt={msg.fileName || 'Attachment'}
                  className="max-w-full h-auto rounded cursor-pointer"
                  onClick={() => window.open(msg.fileURL, '_blank')}
                />
              ) : (
                <a
                  href={msg.fileURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {msg.fileName || 'Download File'}
                </a>
              )}
            </div>
          )}
  
          <small className="text-gray-500 text-xs">
            {msg.timestamp instanceof Date
              ? msg.timestamp.toLocaleString()
              : new Date(msg.timestamp).toLocaleString()}
          </small>
        </div>
      </div>
    );
  };
  

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!chatId) {
      setError('Cannot send message: No chat ID available');
      return;
    }

    if (!newMessage.trim()) {
      return;
    }

    if (!currentUser) {
      setError('User authentication required');
      return;
    }

    try {
      // Determine the message type based on the current user role
      const messageType = currentUser.role === 'support' ? 'support' : 'user';

      await firebaseService.sendDisputeMessage(chatId, {
        senderId: currentUser.uid || currentUser.id,
        message: newMessage.trim(),
        senderRole: currentUser.role || 'user',
        type: messageType, // Send message type as 'support' or 'user'
      });

      setNewMessage('');
      setError(null);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  if (isLoading) {
    return <div>Loading chat...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="text-red-500">{error}</p>
        <button onClick={() => setError(null)}>Retry</button>
      </div>
    );
  }
  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>Chat {customerName ? `with ${customerName}` : ''}{orderNumber && ` - Order #${orderNumber}`}</h2>
        <button onClick={onClose} className="close-button">Close</button>
      </div>

      <div className="messages-container">
        {messages.map(msg => {
          const isOwnMessage = msg.senderId === currentUser?.uid;
          
          return (
            <div
              key={msg.id}
              className={`mb-4 ${isOwnMessage ? 'text-right' : 'text-left'}`}
            >
              <div
                className={`inline-block p-2 rounded ${
                  isOwnMessage ? 'bg-blue-100' : 'bg-gray-100'
                }`}
              >
                {/* Text message */}
                {msg.message && (
                  <p className="text-sm">
                    <span className="font-semibold mr-2">
                      {isOwnMessage ? 'You' : 'Customer'}:
                    </span>
                    {msg.message}
                  </p>
                )}

                {/* File preview */}
                {msg.fileURL && (
                  <div className="file-preview mt-2">
                    {msg.fileType?.startsWith('image/') ? (
                      <img 
                        src={msg.fileURL} 
                        alt={msg.fileName} 
                        className="max-w-full h-auto rounded"
                        onClick={() => window.open(msg.fileURL, '_blank')}
                      />
                    ) : (
                      <a 
                        href={msg.fileURL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Download {msg.fileName}
                      </a>
                    )}
                  </div>
                )}

                <small className="text-gray-500 text-xs">
                  {msg.timestamp instanceof Date
                    ? msg.timestamp.toLocaleString()
                    : new Date(msg.timestamp).toLocaleString()}
                </small>
              </div>
            </div>
          );
        })}
      

      </div>

      <form onSubmit={handleSendMessage} className="message-input-form">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="message-input"
          placeholder="Type your message..."
          rows={3}
        />
        <button 
          type="submit" 
          className="send-button" 
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
