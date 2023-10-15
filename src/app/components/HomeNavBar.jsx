import React from 'react';
import Link from 'next/link';
import { FiUser, FiSearch } from 'react-icons/fi'; 

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center bg-white p-4 border-b border-gray-300">
      <div className="text-black font-bold">
        <Link href="/"> FlipSide </Link>
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