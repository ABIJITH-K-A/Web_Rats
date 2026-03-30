/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 * @param {Date} date - The date to format
 * @returns {string} - Formatted relative time string
 */
export const formatDistanceToNow = (date) => {
  if (!date) return "Recently";

  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}w ago`;
  } else {
    const months = Math.floor(diffInDays / 30);
    return `${months}mo ago`;
  }
};

/**
 * Format a date to a readable string
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format a date to a time string
 * @param {Date} date - The date to format
 * @returns {string} - Formatted time string
 */
export const formatTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
