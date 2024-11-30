import { db } from '../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  onSnapshot, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

export const firebaseService = {
  // Fetch all dispute messages without role filtering
  fetchDisputeMessages: async (disputeId) => {
    try {
      const messagesRef = collection(db, `disputeChats/${disputeId}/messages`);
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('Error fetching dispute messages:', error);
      throw error;
    }
  },

  // Listen to real-time dispute messages
  listenToDisputeMessages: (disputeId, onMessagesUpdate, onError) => {
    const messagesRef = collection(db, `disputeChats/${disputeId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
    return onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        }));
        onMessagesUpdate(messages);
      },
      (error) => {
        console.error('Error in listener:', error);
        onError(error);
      }
    );
  },
  
  // Send a dispute message (either from user or support)
  sendDisputeMessage: async (disputeId, messageData) => {
    try {
      const messagesRef = collection(db, `disputeChats/${disputeId}/messages`);
      const newMessageRef = await addDoc(messagesRef, {
        ...messageData,
        timestamp: serverTimestamp(),
      });
  
      // Update the last message of the dispute
      const disputeRef = doc(db, 'disputeReports', disputeId);
      await updateDoc(disputeRef, {
        lastMessage: messageData.message,
        lastMessageTimestamp: serverTimestamp(),
      });
  
      return newMessageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Fetch open disputes
  fetchOpenDisputes: async () => {
    try {
      const disputesRef = collection(db, 'disputeReports');
      const q = query(disputesRef, where('status', 'in', ['open', 'in_progress']));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching open disputes:', error);
      throw error;
    }
  },

  // Listen to real-time updates for a dispute chat (for support agents)
  listenToSupportDisputeChat: (disputeId, onMessagesUpdate, onError) => {
    const messagesRef = collection(db, `disputeChats/${disputeId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        }));
        onMessagesUpdate(messages);
      },
      (error) => {
        console.error('Error listening to dispute chat:', error);
        onError(error);
      }
    );
  },

  // Fetch disputes for support (real-time listener)
  fetchDisputes: (callback) => {
    const q = query(collection(db, 'disputeReports'));
    return onSnapshot(q, (querySnapshot) => {
      const disputesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'New'
      }));
      callback(disputesList);
    });
  },

  // Update dispute status (when resolved, for example)
  updateDisputeStatus: async (disputeId, newStatus) => {
    const disputeRef = doc(db, 'disputeReports', disputeId);
    await updateDoc(disputeRef, {
      status: newStatus,
      updatedAt: new Date(),
      ...(newStatus === 'Resolved' && { resolvedAt: new Date() })
    });
  },

  // Get a specific dispute by ID
  getDisputeById: async (disputeId) => {
    const disputeRef = doc(db, 'disputeReports', disputeId);
    const disputeSnap = await getDoc(disputeRef);

    if (!disputeSnap.exists()) {
      throw new Error('Dispute not found');
    }

    return {
      id: disputeSnap.id,
      ...disputeSnap.data()
    };
  },

  // Fetch dispute statistics (open, resolved, etc.)
  getDisputeStatistics: async () => {
    const disputesRef = collection(db, 'disputeReports');
    const querySnapshot = await getDocs(disputesRef);

    const disputes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      totalDisputes: disputes.length,
      openDisputes: disputes.filter(dispute => dispute.status === 'Open').length,
      resolvedDisputes: disputes.filter(dispute => dispute.status === 'Resolved').length,
      newDisputes: disputes.filter(dispute => dispute.status === 'New').length,
      averageResolutionTime: calculateAverageResolutionTime(disputes)
    };
  }
};

// Helper function to calculate average resolution time
const calculateAverageResolutionTime = (disputes) => {
  const resolvedDisputes = disputes.filter(dispute => 
    dispute.status === 'Resolved' && dispute.createdAt && dispute.resolvedAt
  );

  if (resolvedDisputes.length === 0) return 0;

  const totalResolutionTime = resolvedDisputes.reduce((total, dispute) => {
    const resolutionTime = dispute.resolvedAt - dispute.createdAt;
    return total + resolutionTime;
  }, 0);

  return totalResolutionTime / resolvedDisputes.length;
};
