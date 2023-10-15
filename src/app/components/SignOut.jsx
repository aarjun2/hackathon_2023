import { auth } from '../firebaseConfig'
import { useSignOut } from 'react-firebase-hooks/auth';

const SignOut = () => {
  const [signOut, loading, error] = useSignOut(auth);

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
      </div>
    );
  }
  if (loading) {
    return <p>Loading...</p>;
  }
  return (
    <div>
      <button className="text-white bg-gray-800 
      hover:bg-gray-900 focus:outline-none focus:ring-4 
      focus:ring-gray-300 font-medium rounded-full 
      text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 
      dark:hover:bg-gray-700 dark:focus:ring-gray-700 
      dark:border-gray-700"
        onClick={async () => {
          const success = await signOut();
          if (success) {
            alert('You are sign out');
          }
        }}
      >
        Sign out
      </button>
    </div>
  );
};

export default SignOut;