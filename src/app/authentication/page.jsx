"use client"

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
        <p> {user.email}</p>
        <Link href={`/user/${user.uid}`}> go to details </Link>
        <SignOut />
      </>
    );
  }
  return (
    <>
      <Login />
      <SignUp />
    </>
  );
};
