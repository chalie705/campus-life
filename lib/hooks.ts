import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UseQueryOptions {
  enabled?: boolean;
}

interface QueryResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

export function useQuery<T>(
  fetcher: () => Promise<{ data: T | null; error: { message: string } | null }>,
  deps: unknown[] = [],
  options: UseQueryOptions = {},
): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetchCount, setRefetchCount] = useState(0);

  const enabled = options.enabled ?? true;

  const run = useCallback(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetcher()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setData(null);
        } else {
          setData(data);
          setError(null);
        }
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refetchCount, enabled]);

  useEffect(() => {
    run();
  }, [run]);

  return {
    data,
    error,
    loading,
    refetch: () => setRefetchCount((c) => c + 1),
  };
}

export function useMutation<T, V>(
  mutationFn: (vars: V) => Promise<{ data: T | null; error: { message: string } | null }>,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = useCallback(
    async (vars: V) => {
      setLoading(true);
      setError(null);
      const result = await mutationFn(vars);
      setData(result.data);
      setError(result.error?.message ?? null);
      setLoading(false);
      return result;
    },
    [mutationFn],
  );

  return { mutate, loading, error, data };
}

export { supabase };
