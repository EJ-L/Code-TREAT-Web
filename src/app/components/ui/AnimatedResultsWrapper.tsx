import React, { FC, ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedResultsWrapperProps {
  children: ReactNode;
  timelineRange: { start: Date; end: Date } | null;
  currentTask: string;
}

export const AnimatedResultsWrapper: FC<AnimatedResultsWrapperProps> = ({
  children,
  timelineRange,
  currentTask
}) => {
  const [animationKey, setAnimationKey] = useState(0);
  const [previousTimelineRange, setPreviousTimelineRange] = useState(timelineRange);

  // Trigger animation when timeline changes
  useEffect(() => {
    const timelineChanged = JSON.stringify(timelineRange) !== JSON.stringify(previousTimelineRange);
    
    if (timelineChanged && timelineRange) {
      setAnimationKey(prev => prev + 1);
      setPreviousTimelineRange(timelineRange);
    }
  }, [timelineRange, previousTimelineRange]);

  // Reset animation key when task changes
  useEffect(() => {
    setAnimationKey(0);
    setPreviousTimelineRange(null);
  }, [currentTask]);

  return (
    <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentTask}-${animationKey}`}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.04, // Stagger the animation of table rows
                delayChildren: 0.1,
                duration: 0.2
              }
            }
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
