import { useEffect, useRef, useState } from 'react';

interface UseHistoryScrollOptions {
  dateKeys: string[];
  containerRef: React.RefObject<HTMLDivElement>;
  dateHeadersRef: React.MutableRefObject<Map<string, HTMLDivElement>>;
}

export function useHistoryScroll({
  dateKeys,
  containerRef,
  dateHeadersRef,
}: UseHistoryScrollOptions) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const isScrollingProgrammaticallyRef = useRef<boolean>(false);
  const programmaticScrollTargetRef = useRef<string | null>(null);
  const scrollEndTimeRef = useRef<number>(0);
  const lastActiveDateUpdateRef = useRef<number>(0);
  const lastActiveDateRef = useRef<string | null>(null);
  const activeDateUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set initial active date
  useEffect(() => {
    if (dateKeys.length > 0 && !activeDate && containerRef.current) {
      const initialDate = dateKeys[0];
      setActiveDate(initialDate);
      lastActiveDateRef.current = initialDate;
      lastActiveDateUpdateRef.current = Date.now();
    }
  }, [dateKeys, activeDate, containerRef]);

  // IntersectionObserver to track visible dates
  useEffect(() => {
    if (dateKeys.length === 0 || !containerRef.current) return;

    let observer: IntersectionObserver | null = null;

    const timeoutId = setTimeout(() => {
      if (!containerRef.current) return;

      const currentDateKeys = new Set(dateKeys);
      dateHeadersRef.current.forEach((_element, date) => {
        if (!currentDateKeys.has(date)) {
          dateHeadersRef.current.delete(date);
        }
      });

      const observerOptions = {
        root: containerRef.current,
        rootMargin: '-10px 0px -80% 0px',
        threshold: [0, 0.1, 0.5, 1]
      };

      observer = new IntersectionObserver((entries) => {
        if (isScrollingProgrammaticallyRef.current) {
          return;
        }
        
        const timeSinceScrollEnd = Date.now() - scrollEndTimeRef.current;
        const targetDate = programmaticScrollTargetRef.current;
        if (targetDate && timeSinceScrollEnd < 800) {
          return;
        }
        
        const visibleDates = entries
          .map(entry => {
            const date = entry.target.getAttribute('data-date');
            if (!date) return null;
            
            const rect = entry.boundingClientRect;
            const containerRect = containerRef.current!.getBoundingClientRect();
            const relativeTop = rect.top - containerRect.top;
            
            return { 
              date, 
              top: relativeTop,
              intersectionRatio: entry.intersectionRatio,
              isIntersecting: entry.isIntersecting
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .filter(item => item.isIntersecting && item.top >= -50 && item.top <= 100);
        
        if (visibleDates.length > 0) {
          visibleDates.sort((a, b) => {
            const aDistance = Math.abs(a.top);
            const bDistance = Math.abs(b.top);
            if (Math.abs(aDistance - bDistance) < 10) {
              return b.intersectionRatio - a.intersectionRatio;
            }
            return aDistance - bDistance;
          });
          
          const newActiveDate = visibleDates[0].date;
          const newActiveDateTop = visibleDates[0].top;
          const currentActiveDate = lastActiveDateRef.current || activeDate;
          
          if (targetDate && newActiveDate !== targetDate && timeSinceScrollEnd < 1500) {
            return;
          }
          
          if (currentActiveDate && newActiveDate !== currentActiveDate) {
            const currentDateEntry = visibleDates.find(v => v.date === currentActiveDate);
            
            if (currentDateEntry) {
              const currentTop = currentDateEntry.top;
              const improvement = Math.abs(currentTop) - Math.abs(newActiveDateTop);
              
              if (improvement < 30) {
                return;
              }
            }
          }
          
          if (activeDateUpdateTimeoutRef.current) {
            clearTimeout(activeDateUpdateTimeoutRef.current);
          }
          
          const timeSinceLastUpdate = Date.now() - lastActiveDateUpdateRef.current;
          const delay = Math.max(0, 150 - timeSinceLastUpdate);
          
          activeDateUpdateTimeoutRef.current = setTimeout(() => {
            lastActiveDateRef.current = newActiveDate;
            lastActiveDateUpdateRef.current = Date.now();
            setActiveDate(newActiveDate);
          }, delay);
        }
      }, observerOptions);

      dateHeadersRef.current.forEach((element) => {
        if (element) {
          observer!.observe(element);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (activeDateUpdateTimeoutRef.current) {
        clearTimeout(activeDateUpdateTimeoutRef.current);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, [dateKeys, activeDate, containerRef, dateHeadersRef]);

  const scrollToDate = (date: string) => {
    const headerElement = dateHeadersRef.current.get(date);
    if (headerElement && containerRef.current) {
      isScrollingProgrammaticallyRef.current = true;
      programmaticScrollTargetRef.current = date;
      
      setActiveDate(date);
      
      const container = containerRef.current;
      const dateSection = headerElement.parentElement as HTMLElement;
      const targetElement = dateSection || headerElement;
      
      const currentScrollTop = container.scrollTop;
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const scrollPosition = currentScrollTop + (targetRect.top - containerRect.top);
      
      container.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
      
      setTimeout(() => {
        setActiveDate(date);
        scrollEndTimeRef.current = Date.now();
        setTimeout(() => {
          isScrollingProgrammaticallyRef.current = false;
          setTimeout(() => {
            programmaticScrollTargetRef.current = null;
          }, 500);
        }, 300);
      }, 1200);
    }
  };

  return {
    activeDate,
    scrollToDate,
  };
}
