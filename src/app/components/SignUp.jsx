import React from 'react'
import { useState } from 'react'
import { auth, db } from '../firebaseConfig'
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { collection, addDoc } from 'firebase/firestore';
function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [
        createUserWithEmailAndPassword,
        user,
        loading,
        error,
    ] = useCreateUserWithEmailAndPassword(auth);

    const handleRegister = () => {
        createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
            const user = userCredential.user;
            addDoc(collection(db, "users"), {
                UID: user.uid,    
              });
            })
            .catch((error) => {
            console.error('Error creating user:', error);
            });
    };

    if (error) {
        return (
        <div>
            <p>Error: {error.message}</p>
        </div>
        );
    }
    if (loading) {
        return <p>Loading...</p>;
    }
    if (user) {
        return (
        <div>
            <p>Registered User: {user.user.email}</p>
        </div>
        );
    }
  return (
    <div>
        <label> Email: </label> 
        <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        />
        <label> Password: </label> 
        <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleRegister}>
        Register
        </button>
    </div>
  )
}

export default SignUp;