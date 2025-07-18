// Simple API test utility
export const testApiConnection = async () => {
  try {
    const response = await fetch('http://localhost:3001/health');
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
    const response = await fetch('http://localhost:3001/api/v1/weather/current?latitude=-36.8485&longitude=174.7633');
    const data = await response.json();
    console.log('✅ Weather API test:', data);
    return data;
  } catch (error) {
    console.error('❌ Weather API failed:', error);
    return null;
  }
};