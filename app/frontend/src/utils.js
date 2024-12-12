
// src/utils.js

// Helper function to format timestamps based on the selected range and interval
export const formatTimestamps = (timestamps, range, interval) => {
  return timestamps.map((ts) => {
    const date = new Date(ts * 1000); // Convert timestamp (seconds) to JavaScript Date object
    
    // Different formatting based on range and interval
    switch (range) {
      case '1d':
        return interval === '1m' || interval === '5m' 
          ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          : date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
      
      case '5d':
        return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
      
      case '1mo':
        return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
      
      case '6mo':
        return date.toLocaleDateString([], {month: 'short', year: 'numeric'});
      
      case '1y':
        return date.toLocaleDateString([], {month: 'short', year: 'numeric'});
      
      default:
        return date.toLocaleDateString();
    }
  });
};
