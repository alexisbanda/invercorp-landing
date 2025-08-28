// src/services/advisorService.ts
import { db } from '../firebase-config';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Advisor } from '../types';

const advisorsCollection = collection(db, 'advisors');

export const getAllAdvisors = async (): Promise<Advisor[]> => {
    const snapshot = await getDocs(advisorsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Advisor));
};

export const createAdvisor = async (data: Omit<Advisor, 'id'>): Promise<string> => {
    const docRef = await addDoc(advisorsCollection, data);
    return docRef.id;
};

export const updateAdvisor = async (id: string, data: Partial<Advisor>): Promise<void> => {
    const advisorDoc = doc(db, 'advisors', id);
    await updateDoc(advisorDoc, data);
};

export const deleteAdvisor = async (id: string): Promise<void> => {
    const advisorDoc = doc(db, 'advisors', id);
    await deleteDoc(advisorDoc);
};
