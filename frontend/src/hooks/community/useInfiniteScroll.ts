import { useEffect, useRef, useCallback, useState } from "react";

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void | Promise<void>;
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  threshold = 0.1,
  rootMargin = "100px",
}: UseInfiniteScrollOptions) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      setIsIntersecting(entry.isIntersecting);

      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersect, threshold, rootMargin]);

  return { elementRef, isIntersecting };
}



