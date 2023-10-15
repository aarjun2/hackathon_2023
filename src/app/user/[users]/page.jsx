"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, where,
deleteDoc, doc, updateDoc} from 'firebase/firestore'; 
import { db, auth } from '@/app/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { motion } from 'framer-motion';
import { FiHome } from 'react-icons/fi';

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
  const [postAdded, setPostAdded] = useState(false); 

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
        console.log('Post added successfully!');
        setPostAdded(true);
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
      <div className="flex justify-center items-center min-h-screen">
        <p>Initializing User...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-4xl mb-8 text-green-700">
          <span>Profile Page</span>
          <Link href="/">
              <FiHome size={24} />
          </Link>
        </h1>
      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        {/* Bio and Preferred Name Section */}
        <motion.div className="bg-green-100 p-6 rounded-lg shadow-lg" whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
          <h3 className="text-2xl mb-4">Bio</h3>
          <textarea 
            className="w-full h-32 border border-green-500 p-2 rounded mb-4" 
            value={bio} 
            onChange={handleBioChange} 
            placeholder="Enter your bio..."
          />
          <button onClick={handleBioSubmit} className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700 transition duration-300">
            Submit Bio
          </button>

          <h3 className="text-2xl mt-8 mb-4">Preferred Name</h3>
          <input 
            className="w-full border border-green-500 p-2 rounded mb-4"
            type="text"
            value={preferredName}
            onChange={handlePreferredNameChange}
            placeholder="Enter your preferred name"
          />
          <button onClick={handlePreferredNameSubmit} className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700 transition duration-300">
            Submit Preferred Name
          </button>
        </motion.div>
          {/* Connection Requests Section */}
          <motion.div className="bg-green-100 p-6 rounded-lg shadow-lg" whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
            <h3 className="text-2xl mb-4">Connection Requests</h3>
            {/* Connection request elements come here */}
            {connectionRequests.map((request, index) => (
              <div key={index} className="mb-4">
                <p className="mb-2">From: {request.fromUid}</p>
                <p className="mb-2">Comment: {request.comments}</p>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleAccept(request.id, request.fromUid)} 
                    className="bg-green-500 text-white py-1 px-4 rounded hover:bg-green-700 transition duration-300"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleReject(request.id)} 
                    className="bg-red-500 text-white py-1 px-4 rounded hover:bg-red-700 transition duration-300"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Connections Section */}
          <motion.div className="bg-green-100 p-6 rounded-lg shadow-lg" whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
            <h3 className="text-2xl mb-4">Connections</h3>
            {/* Connection elements come here */}
            {connectionsData.map((connection, index) => (
              <p key={index} className="mb-2">
                {connection.user1Uid} <span className="mx-1">-</span> {connection.user2Uid}
              </p>
            ))}
          </motion.div>
        </div>

      {/* Create Post Section */}
      <motion.div className="bg-green-100 p-6 rounded-lg shadow-lg lg:col-span-3" whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
        <h3 className="text-2xl mb-6">Create a Post</h3>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full border border-green-500 p-2 rounded"
          />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic"
            className="w-full border border-green-500 p-2 rounded"
          />
          <input
            type="text"
            value={blueSide}
            onChange={(e) => setBlueSide(e.target.value)}
            placeholder="Blue Side"
            className="w-full border border-green-500 p-2 rounded"
          />
          <input
            type="text"
            value={redSide}
            onChange={(e) => setRedSide(e.target.value)}
            placeholder="Red Side"
            className="w-full border border-green-500 p-2 rounded"
          />
          <select 
            value={isGlobal} 
            onChange={(e) => setIsGlobal(e.target.value === 'true')}
            className="w-full border border-green-500 p-2 rounded"
          >
            <option value={true}>Global</option>
            <option value={false}>Private</option>
          </select>
          <button type="submit" className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700 transition duration-300">
            Submit
          </button>
          {postAdded && (
            <div className="bg-green-200 text-green-800 p-4 rounded mb-4">
              Post added successfully!
            </div>
          )}
        </form>
      </motion.div>
    </motion.div>
  </div>
  );
}
