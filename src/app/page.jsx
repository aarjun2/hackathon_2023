"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore'; 
import { db, auth } from './firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import Navbar from './components/HomeNavBar';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionsData, setConnectionsData] = useState([]);
  const [user] = useAuthState(auth);

  const fetchPosts = async (isPrivate) => {
    try {
      let postsQuery;
  
      if (isPrivate) {
        const allowedUserIds = [
          user.uid,
          ...connectionsData.map(connection => connection.user1Uid),  
          ...connectionsData.map(connection => connection.user2Uid)   
        ];
        postsQuery = query(collection(db, 'posts'), where('UID', 'in', allowedUserIds));
      } else {
        postsQuery = query(collection(db, 'posts'), where('isGlobal', '==', true));
      }
  
      const querySnapshot = await getDocs(postsQuery);
      const postsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  
      setPosts(postsData);
      setLoading(false);
    } catch (error) {
      setError(error);
      console.error('Error fetching posts:', error);
    }
  };

  const fetchConnections = async () => {
    try {
      if (!user) return;
  
      const q1 = query(
        collection(db, 'connections'),
        where('user1Uid', '==', user.uid)
      );
  
      const q2 = query(
        collection(db, 'connections'),
        where('user2Uid', '==', user.uid)
      );
  
      const querySnapshot1 = await getDocs(q1);
      const querySnapshot2 = await getDocs(q2);
      const connections1 = querySnapshot1.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const connections2 = querySnapshot2.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const mergedConnections = [...connections1, ...connections2];
      setConnectionsData(mergedConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const handlePrivateButtonClick = () => {
    fetchPosts(true); 
  };

  const handleGlobal = () => {
    fetchPosts(false); 
  };

  useEffect(() => {
    fetchPosts(false); 
  }, []);

  useEffect(() => {
    fetchConnections(); 
  }, [user]);

  if (loading) {
    return (
      <div>
        <p>Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-grow">
        <div className="w-1/5 p-4 border-r border-gray-300 flex flex-col">
        </div>
        <div className="w-1/3 p-4">
          <h1>Home page</h1>
          <button onClick={handlePrivateButtonClick}>Private</button>
          <button onClick={handleGlobal}>Global</button>
          <h2>
            <Link href="/authentication">Registration</Link>
          </h2>
          <div>
            <h3>All Posts:</h3>
            <ul>
              {posts.map((post) => (
                <li key={post.id} className="rounded p-4 border-b border-gray-300 hover:bg-gray-100">
                  <strong>Title:</strong> {post.title} <br />
                  <strong>Text:</strong> {post.text} <br />
                  <Link href={`/post/${post.id}`}>
                    <p> View Post </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="w-1/3 p-4">
          <h1>Column 2</h1>
        </div>
      </div>
    </div>
  );
}