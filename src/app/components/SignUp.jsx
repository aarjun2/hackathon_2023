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
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="rounded-lg p-8 bg-green-500">
            <h2 className="text-2xl font-bold text-white mb-4">Register</h2>
            {error && (
              <div className="text-red-500 mb-4">
                <p>Error: {error.message}</p>
              </div>
            )}
            {loading && <p>Loading...</p>}
            {user && (
              <div>
                <p>Registered User: {user.user.email}</p>
              </div>
            )}
            <input
              type="email"
              className="rounded-lg mb-4 px-3 py-2 w-full bg-green-500
              placeholder-white"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="rounded-lg mb-6 px-3 py-2 w-full bg-green-500
              placeholder-white"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              onClick={handleRegister}
              className="bg-white text-black rounded-lg px-4 py-2 w-full hover:bg-gray-700"
            >
              Register
            </button>
          </div>
        </div>
      );
}

export default SignUp;