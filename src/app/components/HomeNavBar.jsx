import React from 'react';
import Link from 'next/link';
import { FiUser, FiSearch } from 'react-icons/fi'; 

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center bg-white p-4 border-b border-gray-300">
      <div className="text-black font-bold">
        <Link href="/">Heated</Link>
      </div>
      <div className="flex items-center bg-gray-200 rounded-full p-2 w-full max-w-lg">
        <FiSearch className="mr-2" /> 
        <input
          type="text"
          placeholder="Search"
          className="px-2 py-1 rounded-full w-full bg-gray-200" 
        />
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/authentication" className="text-black">
          <FiUser size={24} />
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;