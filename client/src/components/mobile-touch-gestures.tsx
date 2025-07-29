import { useState, useRef, ReactNode } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  className?: string;
  swipeThreshold?: number;
}

export function SwipeableCard({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  onTap,
  className = "",
  swipeThreshold = 100 
}: SwipeableCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    
    if (Math.abs(info.offset.x) > swipeThreshold) {
      if (info.offset.x > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
    
    // Reset position
    x.set(0);
  };

  const handleTap = () => {
    if (!isDragging) {
      onTap?.();
    }
  };

  return (
    <motion.div
      ref={constraintsRef}
      className={`touch-pan-y ${className}`}
      style={{ x, opacity, rotate }}
      drag="x"
      dragConstraints={{ left: -200, right: 200 }}
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
      
      {/* Swipe Indicators */}
      {isDragging && (
        <>
          <motion.div
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-green-500 text-white p-2 rounded-full opacity-0"
            animate={{ opacity: x.get() > 50 ? 1 : 0 }}
          >
            ❤️
          </motion.div>
          <motion.div
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-red-500 text-white p-2 rounded-full opacity-0"
            animate={{ opacity: x.get() < -50 ? 1 : 0 }}
          >
            ❌
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
  threshold?: number;
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  isRefreshing = false, 
  threshold = 60 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const y = useMotionValue(0);

  const handleDragStart = () => {
    setIsPulling(true);
  };

  const handleDrag = (event: any, info: PanInfo) => {
    if (info.offset.y > 0) {
      setPullDistance(info.offset.y);
      y.set(Math.min(info.offset.y, threshold * 1.5));
    }
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    setIsPulling(false);
    
    if (info.offset.y > threshold) {
      await onRefresh();
    }
    
    setPullDistance(0);
    y.set(0);
  };

  const pullProgress = Math.min(pullDistance / threshold, 1);

  return (
    <div className="relative overflow-hidden">
      {/* Pull to Refresh Indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center items-center bg-gray-100 border-b"
        style={{ y: y.get() - threshold }}
        animate={{ height: isPulling ? Math.max(pullDistance, 0) : 0 }}
      >
        <div className="py-4">
          {isRefreshing ? (
            <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full" />
          ) : (
            <motion.div
              animate={{ rotate: pullProgress * 180 }}
              className="text-gray-600"
            >
              ↓
            </motion.div>
          )}
          <p className="text-sm text-gray-600 mt-2">
            {isRefreshing 
              ? "Refreshing..." 
              : pullProgress >= 1 
                ? "Release to refresh" 
                : "Pull to refresh"
            }
          </p>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="touch-pan-x"
      >
        {children}
      </motion.div>
    </div>
  );
}

interface InfiniteScrollProps {
  children: ReactNode;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading?: boolean;
  threshold?: number;
}

export function InfiniteScroll({ 
  children, 
  onLoadMore, 
  hasMore, 
  isLoading = false, 
  threshold = 200 
}: InfiniteScrollProps) {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    if (scrollHeight - scrollTop - clientHeight < threshold && hasMore && !isLoading) {
      onLoadMore();
    }
  };

  return (
    <div 
      className="overflow-y-auto h-full"
      onScroll={handleScroll}
    >
      {children}
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full" />
          <span className="ml-2 text-gray-600">Loading more...</span>
        </div>
      )}
      
      {/* End of List */}
      {!hasMore && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end!</p>
        </div>
      )}
    </div>
  );
}