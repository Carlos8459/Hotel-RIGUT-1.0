'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
  DocumentData,
  WithFieldValue,
  UpdateData,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally but returns the promise.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: WithFieldValue<DocumentData>, options: SetOptions): Promise<void> {
  const promise = setDoc(docRef, data, options);
  promise.catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write', // or 'create'/'update' based on options
        requestResourceData: data,
      })
    )
  });
  return promise;
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally but returns the promise.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: WithFieldValue<DocumentData>): Promise<DocumentReference<DocumentData>> {
  const promise = addDoc(colRef, data);
  promise.catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally but returns the promise.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: UpdateData<DocumentData>): Promise<void> {
  const promise = updateDoc(docRef, data);
  promise.catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
    return promise;
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally but returns the promise.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference): Promise<void> {
  const promise = deleteDoc(docRef);
  promise.catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
    return promise;
}
