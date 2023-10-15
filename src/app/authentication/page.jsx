"use client"
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Login from "../components/Login";
import SignUp from "../components/SignUp";
import SignOut from "../components/SignOut";
import { auth } from "../firebaseConfig";
import { useAuthState } from 'react-firebase-hooks/auth';
import Link from "next/link";

export default function Authentication() {
  const [user, loading, error] = useAuthState(auth);

  const containerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 }
  };

  const buttonVariants = {
    hover: { scale: 1.1, backgroundColor: '#3B82F6' }
  };

  const textVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delay: 0.2 } }
  };

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" exit="exit" variants={containerVariants} >
        <p>Initialising User...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial="hidden" animate="visible" exit="exit" variants={containerVariants} >
        <p>Error: {error}</p>
      </motion.div>
    );
  }

  if (user) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-screen space-y-4"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
      >
        <motion.div animate={{ scale: [1, 1.3, 1], rotate: [0, 360, 0] }} transition={{ duration: 1 }}>
          <FaCheckCircle className="text-green-500 text-6xl" />
        </motion.div>

        <motion.p className="text-lg font-bold text-gray-800" variants={textVariants} initial="hidden" animate="visible">
          Login successful!
        </motion.p>

        <motion.p className="text-blue-500" variants={textVariants} initial="hidden" animate="visible">
          Welcome, {user.email}
        </motion.p>

        <Link href={`/user/${user.uid}`}>
          <motion.a 
            className="bg-blue-500 text-white py-2 px-4 rounded"
            variants={buttonVariants}
            whileHover="hover"
          >
            Go to details
          </motion.a>
        </Link>

        <motion.div variants={textVariants} initial="hidden" animate="visible">
          <SignOut />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex h-screen"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      <div className="flex-1 bg-white p-4 relative">
        <Link href="/">
          <motion.button 
            className="text-blue-500 absolute top-5 left-5"
            whileHover="hover"
          >
            <FaArrowLeft size={25} className="transition-all duration-300 ease-in-out" />
          </motion.button>
        </Link>

        <motion.div variants={textVariants} initial="hidden" animate="visible">
          <Login />
        </motion.div>
      </div>

      <div className="flex-1 bg-green-500 p-4">
        <motion.div variants={textVariants} initial="hidden" animate="visible">
          <SignUp />
        </motion.div>
      </div>
    </motion.div>
  );
};