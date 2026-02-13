import axios from './axios';

export const getAIInsights = async () => {
  try {
    const response = await axios.get('/analytics/ai-insights');
    return response.data;
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    throw error;
  }
};
