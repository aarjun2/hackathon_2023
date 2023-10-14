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
      <button
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