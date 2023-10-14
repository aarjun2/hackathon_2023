"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore'; 
import { db, auth } from './firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { deleteDoc, doc, addDoc, where,
getDoc, setDoc, updateDoc} from 'firebase/firestore';
import Navbar from './components/HomeNavBar';

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

  const fetchPosts = async (isPrivate) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'posts'));
      const postsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      let filteredPosts;
      if (isPrivate) {
        const allowedUserIds = [user?.uid, ...connectionsData.map(connection => connection.user2Uid)];
        filteredPosts = postsData.filter(post => allowedUserIds.includes(post.UID));
      } else {
        filteredPosts = postsData.filter(post => post.isGlobal);
      }

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

      setPosts(filteredPosts);
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

  useEffect(() => {
    fetchPosts();
    fetchConnections();
  }, []);

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
      <ul>
        {nestedComments.map(comment => (
          <li key={comment.id} style={{ marginLeft: `${depth * 20}px` }}>
            {comment.text}
            <button onClick={() => handleReply(comment.id)}>Reply</button>
            <button onClick={() => handleLike(comment.id, comment.userId)} disabled={user && comment.userId === user.uid}>
              Like
            </button>
            {replyPostId === comment.id && (
              <div>
                <textarea
                  placeholder="Enter your reply"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button onClick={() => handleReplySubmit(comment.id)}>Submit Reply</button>
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

  const renderColorButtons = (postId) => {
    return (
      <div>
        <button onClick={() => handleColorButtonClick(postId, 'blue')}>
          Blue
        </button>
        <button onClick={() => handleColorButtonClick(postId, 'red')}>
          Red
        </button>
        {colorChangeMade && <p>Color chosen successfully!</p>}
      </div>
    );
  };

  const handlePrivateButtonClick = () => {
    setPrivatePosts(true);  
    fetchPosts(true);  
  };

  const handleLike = async (commentId, commentUserId) => {
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
  };

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
      <Navbar />
      <div className="flex flex-grow">
        <div className="w-1/5 p-4 border-r border-gray-300 flex flex-col">
          
        </div>
        <div className="w-1/3 p-4">
          <h1>Home page</h1>
          <button onClick={handlePrivateButtonClick}>Private</button>
          <button onClick={handleTogglePosts}>Posts</button>
          <h2>
            <Link href="/authentication">Registration</Link>
          </h2>
          <div>
            <h3>All Posts:</h3>
            <ul>
              {posts.map((post) => (
                <li key={post.id} className="rounded p-4 border-b border-gray-300
                hover:bg-gray-100">
                  <strong>Title:</strong> {post.title} <br />
                  <strong>Text:</strong> {post.text} <br />
                  {renderColorButtons(post.id)}
                  <button onClick={() => handleReply(post.id)}>Reply</button>
                  {user && post.UID === user.uid && (
                    <button onClick={() => handleDelete(post.id)}>Delete</button>
                  )}
                  {replyPostId === post.id && (
                    <div>
                      <textarea
                        placeholder="Enter your reply"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <button onClick={() => handleReplySubmit(post.id)}>Submit</button>
                    </div>
                  )}
                  <ul>
                    {postComments[post.id]?.map((comment) => {
                      if (comment.parentId === post.id) {
                        return (
                          <li key={comment.id}>
                            {comment.text}
                            <button onClick={() => handleReply(comment.id)}>Reply</button>
                            <button onClick={() => handleLike(comment.id, comment.userId)} disabled={user && comment.userId === user.uid}>
                              Like
                            </button>
                            {replyPostId === comment.id && (
                              <div>
                                <textarea
                                  placeholder="Enter your reply"
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                />
                                <button onClick={() => handleReplySubmit(comment.id)}>Submit Reply</button>
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