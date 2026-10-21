'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function RedirectAuthenticatedUser() {
  useEffect(() => {
    let active = true;

    createClient().auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error('Unable to restore the homepage session:', error);
      } else if (data.session) {
        window.location.replace('/dashboard');
      }
    }).catch((error: unknown) => {
      console.error('Unable to restore the homepage session:', error);
    });

    return () => {
      active = false;
    };
  }, []);

  return null;
}
