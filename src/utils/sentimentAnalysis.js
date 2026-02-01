// src/utils/sentimentAnalysis.js
import { analyzeSentiment } from './openRouterAI';

// Additional sentiment analysis utilities
export const getSentimentColor = (sentiment) => {
  switch (sentiment.toLowerCase()) {
    case 'positive':
      return '#10b981'; // Emerald
    case 'negative':
      return '#ef4444'; // Red
    case 'neutral':
      return '#f59e0b'; // Amber
    default:
      return '#6b7280'; // Gray
  }
};

export const getSentimentLabel = (sentiment) => {
  switch (sentiment.toLowerCase()) {
    case 'positive':
      return 'Positive';
    case 'negative':
      return 'Needs Support';
    case 'neutral':
      return 'Neutral';
    default:
      return 'Unknown';
  }
};

// Aggregate sentiment analysis for reports
export const aggregateSentimentData = (sentimentList) => {
  const counts = {
    positive: 0,
    negative: 0,
    neutral: 0
  };

  sentimentList.forEach(sentiment => {
    if (counts.hasOwnProperty(sentiment)) {
      counts[sentiment]++;
    }
  });

  return counts;
};

// Get sentiment trend over time
export const getSentimentTrend = (sentimentHistory) => {
  if (sentimentHistory.length < 2) return 'neutral';

  const recent = sentimentHistory.slice(-7); // Last 7 entries
  const prev = sentimentHistory.slice(-14, -7); // Previous 7 entries

  const recentAvg = calculateAverageSentiment(recent);
  const prevAvg = calculateAverageSentiment(prev);

  if (recentAvg > prevAvg) return 'improving';
  if (recentAvg < prevAvg) return 'declining';
  return 'stable';
};

// Helper function to calculate average sentiment value
const calculateAverageSentiment = (sentiments) => {
  if (sentiments.length === 0) return 0;

  let total = 0;
  sentiments.forEach(s => {
    switch (s.toLowerCase()) {
      case 'positive':
        total += 1;
        break;
      case 'negative':
        total -= 1;
        break;
      case 'neutral':
        total += 0;
        break;
    }
  });

  return total / sentiments.length;
};