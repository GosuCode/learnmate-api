import { UserService } from '../services/userService';

export async function testAuthentication() {
  const userService = new UserService();
  
  console.log('=== Authentication Test ===\n');
  
  // Test registration
  console.log('1. Testing User Registration:');
  try {
    const registerResult = await userService.register({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123'
    });
    
    console.log('✅ Registration successful');
    console.log(`   User ID: ${registerResult.user.id}`);
    console.log(`   Email: ${registerResult.user.email}`);
    console.log(`   Token: ${registerResult.token.substring(0, 20)}...`);
  } catch (error: any) {
    console.log(`❌ Registration failed: ${error.message}`);
  }
  
  console.log('\n2. Testing User Login:');
  try {
    const loginResult = await userService.login({
      email: 'demo@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful');
    console.log(`   User: ${loginResult.user.name}`);
    console.log(`   Token: ${loginResult.token.substring(0, 20)}...`);
    
    // Test token verification
    console.log('\n3. Testing Token Verification:');
    const decoded = userService.verifyToken(loginResult.token);
    if (decoded) {
      console.log('✅ Token verification successful');
      console.log(`   User ID: ${decoded.userId}`);
      console.log(`   Email: ${decoded.email}`);
    } else {
      console.log('❌ Token verification failed');
    }
    
  } catch (error: any) {
    console.log(`❌ Login failed: ${error.message}`);
  }
  
  console.log('\n4. Testing Invalid Login:');
  try {
    await userService.login({
      email: 'wrong@example.com',
      password: 'wrongpassword'
    });
    console.log('❌ Should have failed');
  } catch (error: any) {
    console.log(`✅ Login correctly failed: ${error.message}`);
  }
  
  console.log('\n5. Testing Duplicate Registration:');
  try {
    await userService.register({
      email: 'demo@example.com',
      name: 'Another User',
      password: 'password123'
    });
    console.log('❌ Should have failed');
  } catch (error: any) {
    console.log(`✅ Registration correctly failed: ${error.message}`);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testAuthentication().catch(console.error);
} 