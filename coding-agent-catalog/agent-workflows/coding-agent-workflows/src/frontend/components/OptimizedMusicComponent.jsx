// React performance optimization component
import React, { memo, useMemo, useCallback } from 'react';

// Memoized component for expensive rendering
const OptimizedMusicComponent = memo(({ data, onAction }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: item.name.toLowerCase().replace(/\s+/g, '-')
    }));
  }, [data]);
  
  // Memoize callback functions
  const handleAction = useCallback((id) => {
    onAction(id);
  }, [onAction]);
  
  return (
    <div className="optimized-music-component">
      {processedData.map(item => (
        <div key={item.id} onClick={() => handleAction(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
});

export default OptimizedMusicComponent;