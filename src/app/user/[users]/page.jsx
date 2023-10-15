"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, where,
deleteDoc, doc, updateDoc} from 'firebase/firestore'; 
import { db, auth } from '@/app/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { motion } from 'framer-motion';

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
  const [bio, setBio] = useState(''); 
  const [preferredName, setPreferredName] = useState(''); 
  const [topic, setTopic] = useState('');

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
      setConnectionsData(prevConnections => [
        ...prevConnections,
        { user1Uid: fromUid, user2Uid: user.uid }
      ]);

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
          isGlobal,
          topic
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

  const handleBioChange = (event) => {
    setBio(event.target.value);
  };

  const handlePreferredNameChange = (event) => {
    setPreferredName(event.target.value);
  };

  
  const updateUserData = async (uid, newData) => {
    try {
      const userQuery = query(collection(db, 'users'), where('UID', '==', uid));
      const querySnapshot = await getDocs(userQuery);
  
      if (querySnapshot.empty) {
        console.error('No user found with the provided UID:', uid);
        return;
      }
  
      const userDocRef = doc(db, 'users', querySnapshot.docs[0].id);
      await updateDoc(userDocRef, newData);
  
      console.log('User data updated successfully:', newData);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const handleBioSubmit = async () => {
    if (user) {
      await updateUserData(user.uid, { bio });
    }
  };

  const handlePreferredNameSubmit = async () => {
    if (user) {
      await updateUserData(user.uid, { preferredName });
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
      <h1 className="text-2xl mb-4 text-green-700">Home page</h1>
      <h2 className="mb-4">
        <Link href="/authentication" className="text-green-500 hover:underline">Registration</Link>
      </h2>

      <div className="flex gap-8">
          {/* Left Section: Bio and Preferred Name */}
          <div className="flex flex-col mr-4 bg-green-100 p-6 rounded-lg">
            <div className="mt-8">
              <h3 className="text-xl mb-4">Bio:</h3>
              <div className="flex">
                <textarea
                  placeholder="Bio"
                  value={bio}
                  onChange={handleBioChange}
                  className="w-full border border-green-500 p-2 rounded"
                />
                <button onClick={handleBioSubmit} className="ml-2 py-2 px-4 bg-green-500 text-white rounded hover:bg-green-700 transition duration-300">
                  Submit Bio
                </button>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl mb-4">Preferred Name:</h3>
              <div className="flex">
                <textarea
                  placeholder="Preferred Name"
                  value={preferredName}
                  onChange={handlePreferredNameChange}
                  className="w-full border border-green-500 p-2 rounded"
                />
                <button onClick={handlePreferredNameSubmit} className="ml-2 py-2 px-4 bg-green-500 text-white rounded hover:bg-green-700 transition duration-300">
                  Submit Preferred Name
                </button>
              </div>
            </div>
          </div>

          {/* Middle Section: Connection Requests */}
          <div className="flex flex-col mr-4 bg-green-100 p-6 rounded-lg">
            <div className="mt-8">
              <h3 className="text-xl mb-4">Connection Requests:</h3>
              <ul>
                {connectionRequests.map((request) => (
                  <li key={request.id} className="mb-2">
                    From UID: {request.fromUid}<br />
                    Comments: {request.comments}
                    <button onClick={() => handleAccept(request.id, request.fromUid)} className="ml-2 py-1 px-2 bg-green-500 text-white rounded hover:bg-green-700 transition duration-300">
                      Accept
                    </button>
                    <button onClick={() => handleReject(request.id)} className="ml-2 py-1 px-2 bg-red-500 text-white rounded hover:bg-red-700 transition duration-300">
                      Reject
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Section: Connections */}
          <div className="flex flex-col bg-green-100 p-6 rounded-lg">
            <div className="mt-8">
              <h3 className="text-xl mb-4">Connections:</h3>
              <ul>
                {connectionsData.map((connection) => (
                  <li key={connection.id} className="mb-2">
                    User1 UID: {connection.user1Uid}<br />
                    User2 UID: {connection.user2Uid}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      <div className="mt-8">
        <h3 className="text-xl mb-4">Create a Post:</h3>
        <motion.form 
          onSubmit={handleFormSubmit} 
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <label className="block mb-2 text-green-700">Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-green-500 p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-2 text-green-700">Topic:</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full border border-green-500 p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-2 text-green-700">Blue Side:</label>
            <input
              type="text"
              value={blueSide}
              onChange={(e) => setBlueSide(e.target.value)}
              className="w-full border border-green-500 p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-2 text-green-700">Red Side:</label>
            <input
              type="text"
              value={redSide}
              onChange={(e) => setRedSide(e.target.value)}
              className="w-full border border-green-500 p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-2 text-green-700">Choose:</label>
            <select 
              value={isGlobal} 
              onChange={(e) => setIsGlobal(e.target.value === 'true')}
              className="w-full border border-green-500 p-2 rounded"
            >
              <option value={true} className="text-green-700">Global</option>
              <option value={false} className="text-green-700">Private</option>
            </select>
          </div>
          <button type="submit" className="col-span-2 mt-4 py-2 px-4 bg-green-500 text-white rounded hover:bg-green-700 transition duration-300">
            Submit
          </button>
        </motion.form>
      </div>
    </>
  );
}