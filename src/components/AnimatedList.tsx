import React from 'react';
import { Box, Grow } from '@mui/material';

interface AnimatedListProps {
  children: React.ReactNode[];
  delay?: number;
}

const AnimatedList: React.FC<AnimatedListProps> = ({ children, delay = 100 }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {children.map((child, index) => (
        <Grow
          key={index}
          in={true}
          timeout={300 + (index * delay)}
          style={{ transformOrigin: 'center top' }}
        >
          <Box>{child}</Box>
        </Grow>
      ))}
    </Box>
  );
};

export default AnimatedList;
