const axios = require('axios');

// Test script to verify chat notification system
async function testChatNotificationSystem() {
  const baseURL = 'http://localhost:3000'; // Adjust port as needed
  const adminToken = 'your-admin-token-here'; // Replace with actual admin token

  console.log('🧪 Testing Chat Notification System\n');

  try {
    // 1. Get initial unresolved chat count
    console.log('📊 Step 1: Getting initial unresolved chat count...');
    const initialCountResponse = await axios.get(`${baseURL}/chat/admin/unresolved-count`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const initialCount = initialCountResponse.data.payload?.count || 0;
    console.log(`✅ Initial unresolved chat count: ${initialCount}`);

    // 2. Get all chats to see current state
    console.log('\n📋 Step 2: Getting all chats...');
    const allChatsResponse = await axios.get(`${baseURL}/chat/admin/all`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const allChats = allChatsResponse.data.payload || [];
    const unresolvedChats = allChats.filter(chat => !chat.isResolved);
    console.log(`✅ Total chats: ${allChats.length}`);
    console.log(`✅ Unresolved chats: ${unresolvedChats.length}`);

    // 3. Test resolving a chat (if any unresolved chats exist)
    if (unresolvedChats.length > 0) {
      const chatToResolve = unresolvedChats[0];
      console.log(`\n🔧 Step 3: Resolving chat ${chatToResolve._id}...`);
      
      const resolveResponse = await axios.patch(`${baseURL}/chat/admin/${chatToResolve._id}/resolve`, {}, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (resolveResponse.data.success) {
        console.log('✅ Chat resolved successfully');
      } else {
        console.log('❌ Failed to resolve chat');
      }

      // 4. Check updated count
      console.log('\n📊 Step 4: Checking updated unresolved chat count...');
      const updatedCountResponse = await axios.get(`${baseURL}/chat/admin/unresolved-count`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const updatedCount = updatedCountResponse.data.payload?.count || 0;
      console.log(`✅ Updated unresolved chat count: ${updatedCount}`);
      
      if (updatedCount === initialCount - 1) {
        console.log('✅ ✅ Notification count updated correctly!');
      } else {
        console.log('❌ ❌ Notification count not updated correctly');
      }
    } else {
      console.log('\n⚠️ No unresolved chats to test with');
    }

    // 5. Test the notification endpoint directly
    console.log('\n🔍 Step 5: Testing notification endpoint...');
    const notificationResponse = await axios.get(`${baseURL}/chat/admin/unresolved-count`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Notification endpoint response:', {
      success: notificationResponse.data.success,
      count: notificationResponse.data.payload?.count,
      message: notificationResponse.data.message
    });

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testChatNotificationSystem(); 