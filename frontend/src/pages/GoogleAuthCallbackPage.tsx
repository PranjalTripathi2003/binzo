import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { supabasePublishableKey, supabaseUrl } from '../config/supabase';
import styles from './GoogleAuthCallbackPage.module.css';

type SupabaseSessionResponse = {
  access_token?: string;
  refresh_token?: string;
  msg?: string;
  message?: string;
};

const GoogleAuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const finishSignIn = async () => {
      const query = new URLSearchParams(window.location.search);
      const providerError = query.get('error_description') ?? query.get('error');
      const authCode = query.get('code');
      const verifier = sessionStorage.getItem('supabase_oauth_code_verifier');
      sessionStorage.removeItem('supabase_oauth_code_verifier');

      if (providerError) {
        throw new Error(providerError);
      }
      if (!authCode || !verifier || !supabaseUrl || !supabasePublishableKey) {
        throw new Error('The Google sign-in callback is missing required session data.');
      }

      const response = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=pkce`,
        {
          method: 'POST',
          headers: {
            apikey: supabasePublishableKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ auth_code: authCode, code_verifier: verifier }),
        },
      );
      const session = (await response.json()) as SupabaseSessionResponse;

      if (!response.ok || !session.access_token || !session.refresh_token) {
        throw new Error(session.msg ?? session.message ?? 'Google sign-in could not be completed.');
      }

      localStorage.setItem('access_token', session.access_token);
      localStorage.setItem('refresh_token', session.refresh_token);
      await getCurrentUser();
      navigate('/', { replace: true });
    };

    finishSignIn().catch((reason: unknown) => {
      const message = reason instanceof Error ? reason.message : 'Google sign-in failed.';
      setError(message);
    });
  }, [navigate]);

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-live="polite">
        <h1>{error ? 'Google sign-in failed' : 'Signing you in…'}</h1>
        {error ? (
          <>
            <p>{error}</p>
            <button type="button" onClick={() => navigate('/', { replace: true })}>
              Return to Binzo
            </button>
          </>
        ) : (
          <p>Please wait while we finish your sign-in.</p>
        )}
      </section>
    </main>
  );
};

export default GoogleAuthCallbackPage;
