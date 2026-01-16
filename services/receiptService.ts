import { 
    collection, 
    addDoc, 
    Timestamp,
    getDocs,
    query,
    orderBy
} from 'firebase/firestore';
import { db, auth } from '../firebase-config';

export interface GroupedReceiptItem {
    serviceId: string; // Reference to the original service
    concept: string;
    amount: number;
}

export interface GroupedReceipt {
    id: string; // Firestore Document ID
    receiptNumber: string; // Human readable ID (e.g. G-0001)
    clientName: string;
    clientId: string; // CI/RUC
    items: GroupedReceiptItem[];
    totalAmount: number;
    date: Timestamp;
    issuedBy: string;
    status: 'valid' | 'void';
    voidReason?: string;
    voidedBy?: string;
    voidDate?: Timestamp;
}

export const createGroupedReceipt = async (
    clientName: string,
    clientId: string,
    items: GroupedReceiptItem[]
): Promise<GroupedReceipt> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuario no autenticado');

    if (items.length === 0) throw new Error('No items to receipt');

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    
    // Generate a simple sequential ID locally or random.
    // Ideally we'd use a transaction counter, but for simplicity we'll use a random compliant string or timestamp based.
    // Let's use a Timestamp based "G-YYYYMMDD-XXXX" or similar.
    // Or just "REC-[RANDOM_6]" for now is safer without transactions.
    // Let's emulate the existing format a bit but distinct: "GR-[Random4]"
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `GR-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    const newReceiptData: Omit<GroupedReceipt, 'id'> = {
        receiptNumber,
        clientName,
        clientId,
        items,
        totalAmount,
        date: Timestamp.now(),
        issuedBy: currentUser.email || 'unknown',
        status: 'valid'
    };

    const docRef = await addDoc(collection(db, 'grouped_receipts'), newReceiptData);
    
    return {
        id: docRef.id,
        ...newReceiptData
    };
};

export const getAllGroupedReceipts = async (): Promise<GroupedReceipt[]> => {
    const q = query(collection(db, 'grouped_receipts'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as GroupedReceipt));
};
