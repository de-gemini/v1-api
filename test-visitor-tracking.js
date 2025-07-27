const axios = require('axios');

// Test script to simulate multiple rapid visitor tracking calls
async function testVisitorTracking() {
  const baseURL = 'http://localhost:3000'; // Adjust port as needed
  const sessionId = 'test-session-' + Date.now();
  const testData = {
    path: '/test',
    sessionId: sessionId
  };

  console.log('🧪 Testing visitor tracking with sessionId:', sessionId);
  console.log('📡 Making 5 rapid API calls...\n');

  // Make 5 rapid calls
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      axios.post(`${baseURL}/visitors/track`, testData, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Test-Agent'
        }
      }).then(response => {
        console.log(`✅ Call ${i + 1} completed`);
        return response.data;
      }).catch(error => {
        console.log(`❌ Call ${i + 1} failed:`, error.response?.data || error.message);
        return null;
      })
    );
  }

  try {
    const results = await Promise.all(promises);
    console.log('\n📊 All calls completed!');
    console.log('📈 Results:', results.filter(r => r !== null).length, 'successful calls');
    
    // Check stats to see how many unique visitors were recorded
    const statsResponse = await axios.get(`${baseURL}/visitors/stats`);
    console.log('📊 Visitor stats:', statsResponse.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testVisitorTracking(); 