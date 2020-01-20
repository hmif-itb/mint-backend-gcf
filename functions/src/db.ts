import firebaseAdmin from 'firebase-admin';
import * as functions from 'firebase-functions';

firebaseAdmin.initializeApp(functions.config().firebase);
export default firebaseAdmin.firestore();

export enum Collections {
    ActiveSessions = "activeSessions",
    Sessions = "sessions"
}
