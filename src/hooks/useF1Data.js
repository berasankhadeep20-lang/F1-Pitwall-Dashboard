import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic polling hook for F1 data
 * @param {Function} fetchFn - async function to fetch data
 * @param {Array} deps - dependency array to re-trigger fetch
 * @param {number} interval - refresh interval in ms (default 30s)
 */
export function useF1Data(fetchFn, deps = [], interval = 30_000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isMounted = useRef(true);

  const fetch = useCallback(async () => {
    try {
      const result = await fetchFn();
      if (isMounted.current) {
        setData(result);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMounted.current) setError(err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);
    fetch();

    const timer = setInterval(fetch, interval);
    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, [fetch, interval]);

  return { data, loading, error, lastUpdated, refresh: fetch };
}

/**
 * Hook to fetch multiple F1 data sources in parallel
 */
export function useMultiF1Data(fetchMap, deps = [], interval = 30_000) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isMounted = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      const entries = Object.entries(fetchMap);
      const results = await Promise.allSettled(entries.map(([, fn]) => fn()));
      const newData = {};
      entries.forEach(([key], i) => {
        newData[key] = results[i].status === 'fulfilled' ? results[i].value : null;
      });
      if (isMounted.current) {
        setData(newData);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMounted.current) setError(err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);
    fetchAll();

    const timer = setInterval(fetchAll, interval);
    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, [fetchAll, interval]);

  return { data, loading, error, lastUpdated, refresh: fetchAll };
}
