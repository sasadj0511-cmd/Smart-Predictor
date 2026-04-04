import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Prediction, OperationType } from '../types';
import { handleFirestoreError } from '../services/firestoreService';

export function usePredictions(user: any) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'predictions'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const preds: Prediction[] = [];
      snapshot.forEach((d) => {
        preds.push({ id: d.id, ...d.data() } as Prediction);
      });
      setPredictions(preds);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'predictions');
    });

    return () => unsubscribe();
  }, [user]);

  return predictions;
}
