import { supabase } from '@/lib/supabase';

import { EDGE_FUNCTION_BASE_URL } from './constants';

export async function callEdgeFunction<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${EDGE_FUNCTION_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_WEBAPP_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, ...data };
  }

  return data as T;
}
