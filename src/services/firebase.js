import { initializeApp } from 'firebase/app';
import { getFirestore, getDoc, doc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDni_CDXk80T4e4DbmAdxPejk6K8gl1_BE",
    authDomain: "assignment-santa.firebaseapp.com",
    projectId: "assignment-santa",
    storageBucket: "assignment-santa.appspot.com",
    messagingSenderId: "697591868119",
    appId: "1:697591868119:web:ab0da28fc783e036ab1e92"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function getChat() {
    const unsub = onSnapshot(doc(db, "chat", "user1_user2"), (doc) => {
        console.log(doc.data().conversation);
    });
}