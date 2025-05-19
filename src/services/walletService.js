import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

// Save wallet approval data to Firestore
export const saveWalletApproval = async (walletAddress, amount, txHash) => {
  try {
    const docRef = await addDoc(collection(db, "approvals"), {
      walletAddress,
      amount,
      txHash,
      timestamp: Timestamp.now(),
      status: "approved"
    });
    
    console.log("Approval saved with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving approval: ", error);
    throw error;
  }
};

// Get all wallet approvals
export const getAllApprovals = async () => {
  try {
    const approvalCollection = collection(db, "approvals");
    const approvalSnapshot = await getDocs(approvalCollection);
    const approvalList = approvalSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    
    return approvalList;
  } catch (error) {
    console.error("Error getting approvals: ", error);
    throw error;
  }
};

// Get approvals for a specific wallet
export const getApprovalsByWallet = async (walletAddress) => {
  try {
    const approvalCollection = collection(db, "approvals");
    const q = query(approvalCollection, where("walletAddress", "==", walletAddress));
    const approvalSnapshot = await getDocs(q);
    const approvalList = approvalSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    
    return approvalList;
  } catch (error) {
    console.error("Error getting approvals by wallet: ", error);
    throw error;
  }
}; 