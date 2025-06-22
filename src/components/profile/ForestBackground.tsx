import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import './LearningProgress.css';

interface Leaf {
  x: number;
  y: number;
  delay: number;
  duration: number;
}

export const ForestBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<Leaf[]>([]);
  const requestRef = useRef<number | undefined>(undefined);

  const createLeaves = () => {
    if (!containerRef.current) return;
    
    const leaves: Leaf[] = [];
    const containerWidth = containerRef.current.offsetWidth;
    
    for (let i = 0; i < 20; i++) {
      leaves.push({
        x: Math.random() * containerWidth,
        y: Math.random() * 500 + 500, // Start below the container
        delay: Math.random() * 5,
        duration: 5 + Math.random() * 5
      });
    }
    
    leavesRef.current = leaves;
  };

  useEffect(() => {
    createLeaves();
    
    const handleResize = () => {
      createLeaves();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      className="forest-background"
      sx={{
        position: 'relative',
        minHeight: '400px',
        background: 'linear-gradient(135deg, #1a472a 0%, #2d5a27 100%)',
        borderRadius: 2,
        p: 3,
        overflow: 'hidden'
      }}
    >
      {/* Animated stars layer */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.5
        }}
      />
      
      {/* Floating leaves */}
      {leavesRef.current.map((leaf, index) => (
        <Box
          key={index}
          className="leaf"
          sx={{
            left: leaf.x,
            top: -10,
            animation: `floatingLeaves ${leaf.duration}s linear infinite`,
            animationDelay: `${leaf.delay}s`
          }}
        />
      ))}
      
      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Box>
    </Box>
  );
}; 