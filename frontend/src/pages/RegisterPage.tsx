import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { registerUser } from '@/lib/AuthApi';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectParam = new URLSearchParams(location.search).get('redirect');
  const safeRedirect = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords must match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser(email, password);
      setSuccessMessage('Registration succeeded. You can log in now.');
      setTimeout(() => navigate(`/login?redirect=${encodeURIComponent(safeRedirect)}`), 800);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to register.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold mb-2">Create Account</h1>
      <p className="text-muted-foreground mb-6">
        Register for a Safe Harbor account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-2 font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-md border px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-2 font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-md border px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block mb-2 font-medium">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="w-full rounded-md border px-3 py-2"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>

        {errorMessage ? (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-green-700">
            {successMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-black text-white px-4 py-2 disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <Link to={`/login?redirect=${encodeURIComponent(safeRedirect)}`} className="underline">
          Log in
        </Link>
      </p>
    </div>
  );
}