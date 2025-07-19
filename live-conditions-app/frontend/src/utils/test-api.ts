// Simple API test utility
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';

export const testApiConnection = async () => {
  try {
    console.log('Testing API connection to:', `${API_BASE}/health`);
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('✅ Backend health check:', data);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
};

export const testWeatherApi = async () => {
  try {
    const url = `${API_BASE}/v1/weather/current?latitude=-36.8485&longitude=174.7633`;
    console.log('Testing Weather API at:', url);
    const response = await fetch(url);
    const data = await response.json();
    console.log('✅ Weather API test:', data);
    return data;
  } catch (error) {
    console.error('❌ Weather API failed:', error);
    return null;
  }
};