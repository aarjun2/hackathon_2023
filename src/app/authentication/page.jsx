"use client"

import { FaArrowLeft} from 'react-icons/fa';
import { FaCheckCircle } from 'react-icons/fa';
import Login from "../components/Login";
import SignUp from "../components/SignUp"
import SignOut from "../components/SignOut"
import { auth } from "../firebaseConfig";
import { useAuthState } from 'react-firebase-hooks/auth';
import Link from "next/link";

export default function Authentication() {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return (
      <div>
        <p>Initialising User...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
      </div>
    );
  }
  if (user) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-screen">
          <FaCheckCircle className="text-green-500 text-6xl mb-4" />
          <p className="text-lg font-bold text-gray-800 mb-2">Login successful!</p>
          <p className="text-blue-500 mb-8">Welcome, {user.email}</p>
          <Link href={`/user/${user.uid}`} className="bg-blue-500 
          text-white py-2 px-4 rounded hover:bg-blue-600 
          transition duration-300 mb-4">Go to details</Link>
          <SignOut />
        </div>
      </>
    );
  }
  return (
    <div className="flex h-screen">
      <div className="flex-1 bg-white p-4" style={{ position: 'relative' }}>
        <Link href="/">
          <button className="text-blue-500" style={{ position: 'absolute', top: 20, left: 10 }}>
            <FaArrowLeft size={25}/>
          </button>
        </Link>
        <Login />
      </div>
      <div className="flex-1 bg-green-500 p-4">
        <SignUp />
      </div>
    </div>
  );
};
