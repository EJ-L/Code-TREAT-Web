import React, { FC, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedTableRowProps {
  children: ReactNode;
  index: number;
  className?: string;
}

export const AnimatedTableRow: FC<AnimatedTableRowProps> = ({
  children,
  index,
  className = ""
}) => {
  return (
    <motion.tr
      className={className}
      variants={{
        hidden: { 
          opacity: 0,
          scale: 0.98
        },
        visible: { 
          opacity: 1,
          scale: 1,
          transition: {
            duration: 0.4,
            ease: "easeOut"
          }
        }
      }}
      style={{
        transformOrigin: 'center center' // Ensure scaling happens from center
      }}
    >
      {children}
    </motion.tr>
  );
};
