import React from 'react'
import { useState } from 'react'
import { auth } from '../firebaseConfig'
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [
        signInWithEmailAndPassword,
        user,
        loading,
        error,
    ] = useSignInWithEmailAndPassword(auth);

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
            <p>Signed In User: {user.user.email}</p>
        </div>
        );
    }
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-white rounded-lg p-8">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Sign In</h2>
          {error && (
            <div className="text-red-500 mb-4">
              <p>Error: {error.message}</p>
            </div>
          )}
          {loading && <p>Loading...</p>}
          {user && (
            <div>
              <p>Signed In User: {user.user.email}</p>
            </div>
          )}
          <input
            type="email"
            className="rounded-lg mb-4 px-3 py-2 w-full"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="rounded-lg mb-6 px-3 py-2 w-full"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={() => signInWithEmailAndPassword(email, password)}
            className="bg-green-800 text-white rounded-lg px-4 py-2 w-full hover:bg-green-600"
          >
            Sign In
          </button>
        </div>
      </div>
    );
}

export default Login