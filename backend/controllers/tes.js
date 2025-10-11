// test-redis-only.js
import { Redis } from '@upstash/redis';

const redis = new Redis({

});

async function testRedis() {
  try {
    console.log('🧪 Testing Redis connection...');
    
    // Test set
    await redis.set('test_key', 'Hello Redis from Local!');
    console.log('✅ Set operation successful');
    
    // Test get
    const value = await redis.get('test_key');
    console.log('✅ Get operation successful:', value);
    
    // Test online users functionality
    await redis.sadd('online_users', 'test_user_123');
    const onlineUsers = await redis.smembers('online_users');
    console.log('✅ Online users test:', onlineUsers);
    
    // Test multiple users
    await redis.sadd('online_users', 'user_456', 'user_789');
    const allOnlineUsers = await redis.smembers('online_users');
    console.log('✅ Multiple users online:', allOnlineUsers);
    
    // Test removing a user
    await redis.srem('online_users', 'test_user_123');
    const finalOnlineUsers = await redis.smembers('online_users');
    console.log('✅ After removing user:', finalOnlineUsers);
    
    console.log('🎉 All Redis tests passed! Your Redis is working perfectly!');
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
  }
}

testRedis();