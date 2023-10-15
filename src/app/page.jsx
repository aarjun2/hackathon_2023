"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore'; 
import { db, auth } from './firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import Navbar from './components/HomeNavBar';
import { motion } from 'framer-motion';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionsData, setConnectionsData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [user] = useAuthState(auth);
  const [userComments, setUserComments] = useState({});
  const [pendingRequests, setPendingRequests] = useState([]);

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

  const fetchPendingRequests = async () => {
    try {
      if (!user) return;

      const q = query(
        collection(db, 'connection_requests'),
        where('fromUid', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPendingRequests(requestsData);
    } catch (error) {
      console.error('Error fetching connection requests:', error);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [user]);

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

  const handleConnect = async (targetUid) => {
    try {
      const commentsForTarget = userComments[targetUid] || ''; 
      const connectionRequest = {
        fromUid: user.uid,
        toUid: targetUid,
        comments: commentsForTarget, 
      };

      await addDoc(collection(db, 'connection_requests'), connectionRequest);
      console.log('Connection request sent successfully!');
      fetchPendingRequests();
    } catch (error) {
      console.error('Error sending connection request:', error);
      setError('Error sending connection request.');
    }
  };

  const fetchUsers = async () => {
    try {
      const usersQuery = query(collection(db, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      const usersData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUserData(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handlePrivateButtonClick = () => {
    fetchPosts(true); 
  };

  const handleGlobal = () => {
    fetchPosts(false); 
  };

  const handleCommentChange = (userId, comment) => {
    setUserComments((prevComments) => ({
      ...prevComments,
      [userId]: comment,
    }));
  };

  useEffect(() => {
    fetchPosts(false);
    if (user) {
      fetchConnections();
    }
    fetchUsers();
  }, [user]);

  const filterUsers = (users, currentUser, connections) => {
    const currentUserUid = currentUser?.uid;
    const connectedUserIds = connections.map(connection => (
      connection.user1Uid === currentUserUid ? connection.user2Uid : connection.user1Uid
    ));

    return users.filter(user => user.UID !== currentUserUid && !connectedUserIds.includes(user.UID));
  };

  const filteredUsers = filterUsers(userData, user, connectionsData);

  const isRequestPending = (userId) => {
    return pendingRequests.some(request => request.toUid === userId);
  };

  const getUserDisplayName = (user) => {
    return user.preferredName ? user.preferredName : 'Anonymous';
  };

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
        <div className="w-1/2 p-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-blue-500 hover:bg-blue-700 
            text-white font-bold py-2 px-4 
            rounded-full mr-4"
            onClick={handlePrivateButtonClick}
          >
            Private
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-green-500 hover:bg-green-700 
            text-white font-semibold py-2 px-4 rounded-full"
            onClick={handleGlobal}
          >
            Global
          </motion.button>
          <div>
            <h3 className="mt-4">All Posts:</h3>
            <ul>
              {posts.map((post) => (
                <motion.li
                  key={post.id}
                  className="rounded p-4 border-b border-gray-300 hover:bg-gray-100"
                  whileHover={{ scale: 1.05 }}
                >
                  <strong>Title:</strong> {post.title} <br />
                  <strong> {post.blueSide} vs {post.redSide} </strong> <br />
                  <strong> #{post.topic} </strong>
                  <Link href={`/post/${post.id}`}>
                    <p> View Post </p>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
        <div className="w-1/2 p-4">
        {user && (
            <>
              <h1 className="mb-4">Users:</h1>
              <ul>
                {filteredUsers.map((user) => (
                  <motion.li
                    key={user.id}
                    whileHover={{ scale: 1.05 }}
                    className="mb-4"
                  >
                    {`Name: ${getUserDisplayName(user)}`}
                    {isRequestPending(user.UID) ? (
                      <p>Pending Request</p>
                    ) : (
                      <>
                        <textarea
                        placeholder="Enter comments"
                        value={userComments[user.UID] || ''}
                        onChange={(e) => handleCommentChange(user.UID, e.target.value)}
                        className="block w-full p-2 mt-2"
                      />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleConnect(user.UID)}
                          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                        >
                          Connect
                        </motion.button>
                      </>
                    )}
                  </motion.li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}