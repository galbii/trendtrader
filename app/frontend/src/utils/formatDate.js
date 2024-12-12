export const formatTimestamp = (timestamp, range, interval) => {
  const date = new Date(timestamp * 1000);

  switch (range) {
    case '1d':
      return interval === '1m' || interval === '5m'
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    case '5d':
    case '1mo':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    case '6mo':
    case '1y':
      return date.toLocaleDateString([], { month: 'short', year: 'numeric' });

    default:
      return date.toLocaleDateString();
  }
};
