import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logoutUser } from '@/lib/AuthApi';

export default function LogoutPage() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function runLogout() {
      try {
        await logoutUser();
        if (isMounted) {
          navigate('/login');
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to log out.'
          );
        }
      }
    }

    void runLogout();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold mb-2">Logging out</h1>
      <p className="text-muted-foreground mb-6">
        Ending your session securely.
      </p>

      {errorMessage ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700">
          {errorMessage}
        </div>
      ) : (
        <p className="text-muted-foreground">Please wait...</p>
      )}

      <p className="mt-4 text-sm">
        Need to go back?{' '}
        <Link to="/" className="underline">
          Return home
        </Link>
      </p>
    </div>
  );
}