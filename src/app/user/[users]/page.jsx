"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, where,
deleteDoc, doc } from 'firebase/firestore'; 
import { db, auth } from '@/app/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function Home() {
  const [userData, setUserData] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, userLoading] = useAuthState(auth);
  const [title, setTitle] = useState('');
  const [blueSide, setBlueSide] = useState('');
  const [redSide, setRedSide] = useState('');
  const [comments, setComments] = useState({});
  const [connectionsData, setConnectionsData] = useState([]);
  const [isGlobal, setIsGlobal] = useState(true);

  const fetchConnectionRequests = async () => {
    try {
      if (!user) return;

      const q = query(
        collection(db, 'connection_requests'),
        where('toUid', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setConnectionRequests(requestsData);
    } catch (error) {
      setError(error);
      console.error('Error fetching connection requests:', error);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userLoading && user) {
          const data = [];
          const querySnapshot = await getDocs(collection(db, 'users'));
          querySnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.UID !== user.uid) {
              data.push({ id: doc.id, ...userData });
            }
          });
          setUserData(data);
          setLoading(false);
        }
      } catch (error) {
        setError(error);
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [userLoading, user]);

  useEffect(() => {
    fetchConnectionRequests();
    fetchConnections();
  }, [user]);

  const handleCommentChange = (userId, comment) => {
    setComments((prevComments) => ({
      ...prevComments,
      [userId]: comment
    }));
  };

  const handleConnect = async (targetUid) => {
    try {
      const commentsForTarget = comments[targetUid];
      const connectionRequest = {
        fromUid: user.uid,
        toUid: targetUid,
        comments: commentsForTarget || ''
      };

      await addDoc(collection(db, 'connection_requests'), connectionRequest);
      console.log('Connection request sent successfully!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      setError('Error sending connection request.');
    }
  };

  const handleAccept = async (requestId, fromUid) => {
    try {
      
      await addDoc(collection(db, 'connections'), {
        user1Uid: fromUid,
        user2Uid: user.uid
      });

      await deleteDoc(doc(db, 'connection_requests', requestId));

      fetchConnectionRequests();
    } catch (error) {
      console.error('Error accepting connection request:', error);
      setError('Error accepting connection request.');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await deleteDoc(doc(db, 'connection_requests', requestId));
      fetchConnectionRequests();
    } catch (error) {
      console.error('Error rejecting connection request:', error);
      setError('Error rejecting connection request.');
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
  
    try {
      if (title && blueSide && redSide && user) {
        const postData = {
          UID: user.uid,
          title,
          blueSide,
          redSide,
          isGlobal
        };
  
        await addDoc(collection(db, 'posts'), postData);
        console.log('Post added successfully!');//NEED TO REMOVE
      } else {
        console.error('Please fill in all fields.');
        setError('Please fill in all fields.');
      }
    } catch (error) {
      console.error('Error adding post:', error);
      setError('Error adding post.');
    }
  };

  if (loading || userLoading) {
    return (
      <div>
        <p>Initialising User...</p>
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
    <>
      <h1>Home page</h1>
      <h2>
        <Link href="/authentication">Registration</Link>
      </h2>
      <div>
        <h3>User Data (excluding current user):</h3>
        <ul>
          {userData.map((user) => (
            <li key={user.id}>
              {`UID: ${user.UID}`}
              <button onClick={() => handleConnect(user.UID)}>Connect</button>
              <textarea
                placeholder="Enter comments"
                value={comments[user.UID] || ''}
                onChange={(e) => handleCommentChange(user.UID, e.target.value)}
              />
              </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Connection Requests:</h3>
        <ul>
          {connectionRequests.map((request) => (
            <li key={request.id}>
              From UID: {request.fromUid}<br />
              Comments: {request.comments}
              <button onClick={() => handleAccept(request.id, request.fromUid)}>Accept</button>
              <button onClick={() => handleReject(request.id)}>Reject</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
      <h3>Connections:</h3>
      <ul>
        {connectionsData.map((connection) => (
          <li key={connection.id}>
            User1 UID: {connection.user1Uid}<br />
            User2 UID: {connection.user2Uid}
          </li>
        ))}
      </ul>
    </div>
      <h3>Create a Post:</h3>
      <form onSubmit={handleFormSubmit}>
          <div>
            <label>Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label>Blue Side:</label>
            <input
              type="text"
              value={blueSide}
              onChange={(e) => setBlueSide(e.target.value)}
            />
          </div>
          <div>
            <label>Red Side:</label>
            <input
              type="text"
              value={redSide}
              onChange={(e) => setRedSide(e.target.value)}
            />
          </div>
          <div>
            <label>Choose:</label>
            <select value={isGlobal} onChange={(e) => setIsGlobal(e.target.value === 'true')}>
              <option value={true}>Global</option>
              <option value={false}>Private</option>
            </select>
          </div>
          <button type="submit">Submit</button>
        </form>
    </>
  );
}