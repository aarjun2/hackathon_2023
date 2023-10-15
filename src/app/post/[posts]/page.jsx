"use client";

import Link from 'next/link';
import React, { useEffect, useState, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore'; 
import { db, auth } from '@/app/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { deleteDoc, doc, addDoc, where,
getDoc, setDoc, updateDoc, query} from 'firebase/firestore';
import Navbar from '@/app/components/HomeNavBar';
import { useParams } from 'next/navigation';
import { AiFillLike } from 'react-icons/ai';
import { motion } from 'framer-motion'; 

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useAuthState(auth);
  const [replyPostId, setReplyPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [postComments, setPostComments] = useState({});
  const [chosenColor, setChosenColor] = useState(null);
  const [colorChangeMade, setColorChangeMade] = useState(false);
  const [privatePosts, setPrivatePosts] = useState(false);
  const [connectionsData, setConnectionsData] = useState([]);

  const params = useParams();

  const fetchPosts = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'posts'));
      const postsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  
      const commentsPromises = postsData.map(async (post) => {
        const commentsQuerySnapshot = 
          await getDocs(collection(db, 'comments'), where('parentId', '==', post.id));
        const commentsData = 
          commentsQuerySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return { postId: post.id, comments: commentsData };
      });
  
      const commentsForPosts = await Promise.all(commentsPromises);
      const commentsObj = commentsForPosts.reduce((acc, item) => {
        acc[item.postId] = item.comments;
        return acc;
      }, {});
      setPostComments(commentsObj);
  
      setPosts(postsData);
      setLoading(false);
    } catch (error) {
      setError(error);
      console.error('Error fetching posts:', error);
    }
  }, []);  

  const fetchConnections = useCallback(async () => {
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
  }, [user]);
  
  useEffect(() => {
    fetchPosts();
    fetchConnections();
  }, [fetchConnections, fetchPosts]);

  const handleDelete = async (postId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleReply = (postId) => {
    setReplyPostId(postId);
    console.log('Replying to post with ID:', postId);
  };

  const handleReplySubmit = async (commentId) => {
    try {
      if (!user || !user.uid) {
        console.error('User is not authenticated.');
        return;
      }

    const postDocRef = doc(db, 'posts', params.posts);
    const postDocSnapshot = await getDoc(postDocRef);

    if (postDocSnapshot.exists()) {
      const postData = postDocSnapshot.data();
      const updatedCommentCount = (postData.commentCount || 0) + 1;

      if (updatedCommentCount === 10) {
        const changeCount = (postData.change_count || 0) + 1;
        console.log('Change count:', changeCount);
      }

      const updatedPostData = {
        ...postData,
        commentCount: updatedCommentCount,
      };

      await updateDoc(postDocRef, updatedPostData);
    }

      const commentData = {
        text: commentText,
        parentId: commentId,
        childId: null,
        userId: user.uid,
      };
      
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      console.log('Comment added with ID:', docRef.id);
      console.log(user.uid);
      const parentCommentDoc = await doc(db, 'comments', commentId);
      const parentComment = (await getDoc(parentCommentDoc)).data();
      const updatedParentComment = {
        ...parentComment,
        childId: docRef.id
      };
      await setDoc(parentCommentDoc, updatedParentComment);
      setCommentText('');
      setReplyPostId(null);
      fetchPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const renderNestedComments = (comments, parentId, depth) => {
    const nestedComments = comments.filter(comment => comment.parentId === parentId);
  
    if (nestedComments.length === 0) {
      return null;
    }
  
    return (
      <ul className="pl-4 border-l border-gray-300">
        {nestedComments.map(comment => (
          <li key={comment.id} className="mb-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-400 rounded-full mr-2"></div>
              <div className="text-gray-700">{comment.text}</div>
            </div>
            <button onClick={() => handleReply(comment.id)} className="text-sm ml-6">
              Reply
            </button>
            <button
              onClick={() => handleLike(comment.id, comment.userId)}
              disabled={user && comment.userId === user.uid}
              className="text-sm ml-2"
            >
              Like
            </button>
            {replyPostId === comment.id && (
              <div className="ml-6">
                <textarea
                  placeholder="Enter your reply"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                />
                <button
                  onClick={() => handleReplySubmit(comment.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Submit Reply
                </button>
              </div>
            )}
            {renderNestedComments(comments, comment.id, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  const handleColorButtonClick = async (postId, color) => {
    try {
      const postDocRef = doc(db, 'posts', postId);
      const postDocSnapshot = await getDoc(postDocRef);
  
      if (postDocSnapshot.exists()) {
        const postData = postDocSnapshot.data();
        const updatedPostData = {
          ...postData,
          change_count: (postData.change_count || 0) + 1,
        };
        await updateDoc(postDocRef, updatedPostData);
        if (chosenColor !== color) {
          if (chosenColor) {
            console.log('Changing vote from', chosenColor, 'to', color);
            const updatedPostData = {
              ...postData,
              [chosenColor]: Math.max(0, postData[chosenColor] - 1),
              [color]: (postData[color] || 0) + 1
            };
            await updateDoc(postDocRef, updatedPostData);
            setChosenColor(color);
          } else {
            console.log('First vote for', color);
            const updatedPostData = {
              ...postData,
              [color]: (postData[color] || 0) + 1
            };
            await updateDoc(postDocRef, updatedPostData);
            setChosenColor(color);
          }
  
          setColorChangeMade(true);
          setTimeout(() => {
            setColorChangeMade(false);
          }, 3000);
        } else {
          console.log('User has already voted for', chosenColor);
        }
      } else {
        console.error('Post document not found');
      }
    } catch (error) {
      console.error('Error updating color in post:', error);
    }
  };

  const ButtonWithAnimation = ({ onClick, color, children }) => {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`rounded-full px-6 py-3 ${color === 'blue' ? 'bg-blue-500' : 'bg-red-500'} text-white mr-4`}
      >
        {children}
      </motion.button>
    );
  };

  const renderColorButtons = (postId) => {
    const post = posts.find(post => post.id === postId);
    return (
      <div>
         <ButtonWithAnimation onClick={() => handleColorButtonClick(postId, 'blue')} color="blue">
            Blue
          </ButtonWithAnimation>
          <ButtonWithAnimation onClick={() => handleColorButtonClick(postId, 'red')} color="red">
            Red
          </ButtonWithAnimation>
        {colorChangeMade && <p>Color chosen successfully!</p>}
        {post && post.commentCount >= 10 && <p>Discussion Ended</p>}
        {post && post.commentCount >= 10 && <p>{post.change_count}</p>}
        {post && post.commentCount >= 10 && <p>{post.blueSide}</p>}
        {post && post.commentCount >= 10 && <p>{post.redSide}</p>}
      </div>
    );
  };

  const handlePrivateButtonClick = () => {
    setPrivatePosts(true);  
    fetchPosts(true);  
  };

  const handleLike = useCallback(async (commentId, commentUserId) => {
    if (!user || !user.uid || user.uid === commentUserId) {
      console.error('Cannot like this comment.');
      return;
    }
  
    try {
      const commentRef = doc(db, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
  
      if (commentDoc.exists()) {
        const commentData = commentDoc.data();
        const updatedLikes = (commentData.likes || 0) + 1;
  
        if (commentData.likedBy && commentData.likedBy.includes(user.uid)) {
          console.error('You can only like a comment once.');
          return;
        }
  
        const updatedLikedBy = commentData.likedBy
          ? [...commentData.likedBy, user.uid]
          : [user.uid];
  
        await updateDoc(commentRef, { likes: updatedLikes, likedBy: updatedLikedBy });
        console.log('Comment liked:', commentId);
      } else {
        console.error('Comment document not found.');
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  }, [user]);

  const handleTogglePosts = () => {
    setPrivatePosts(false);  
    fetchPosts(false);  
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
      <div className="flex flex-grow">
        <div className="flex-grow p-4">
          <div>
            <ul>
              {posts.map((post) => {
                if (post.id === params.posts) {
                  return (
                    <li key={post.id} className="rounded p-4 border-b border-gray-300 hover:bg-gray-100">
                      <strong>Title:</strong> {post.title} <br />
                      <strong>{post.blueSide} vs {post.redSide}</strong> <br />
                      {renderColorButtons(post.id)}
                      <button onClick={() => handleReply(post.id)} className="rounded bg-blue-500 text-white p-2">
                        Reply
                      </button>
                      {user && post.UID === user.uid && (
                        <button onClick={() => handleDelete(post.id)} className="rounded bg-red-500 text-white p-2">
                          Delete
                        </button>
                      )}
                      {replyPostId === post.id && (
                        <div>
                          <textarea
                            placeholder="Enter your reply"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="w-full p-2 border rounded mb-2"
                          />
                          <button onClick={() => handleReplySubmit(post.id)} className="bg-blue-500 text-white p-2 rounded">
                            Submit
                          </button>
                        </div>
                      )}
                      <ul>
                        {postComments[post.id]?.map((comment) => {
                          if (comment.parentId === post.id) {
                            return (
                              <li key={comment.id}>
                                {comment.text}
                                <button onClick={() => handleReply(comment.id)} className="rounded bg-blue-500 text-white p-2">
                                  Reply
                                </button>
                                <button
                                  onClick={() => handleLike(comment.id, comment.userId)}
                                  disabled={user && comment.userId === user.uid}
                                  className="rounded bg-green-500 text-white p-2"
                                >
                                  <AiFillLike /> Like
                                </button>
                                {replyPostId === comment.id && (
                                  <div>
                                    <textarea
                                      placeholder="Enter your reply"
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      className="w-full p-2 border rounded mb-2"
                                    />
                                    <button
                                      onClick={() => handleReplySubmit(comment.id)}
                                      className="bg-blue-500 text-white p-2 rounded"
                                    >
                                      Submit Reply
                                    </button>
                                  </div>
                                )}
                                {renderNestedComments(postComments[post.id], comment.id, 1)}
                              </li>
                            );
                          } else {
                            return null;
                          }
                        })}
                      </ul>
                    </li>
                  );
                } else {
                  return null;
                }
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}