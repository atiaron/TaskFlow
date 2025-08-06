/**
 * Memory System Test Runner
 * הפעלת בדיקות מערכת הזיכרון
 */

import { runMemoryIntegrationTest } from './MemoryIntegrationTest';

const testMemorySystem = async () => {
  console.log('🚀 Starting TaskFlow Memory System Tests');
  console.log('=====================================');
  
  try {
    await runMemoryIntegrationTest();
    console.log('');
    console.log('🎉 All tests completed successfully!');
    console.log('Memory system is ready for production use.');
  } catch (error) {
    console.error('');
    console.error('❌ Test suite failed:', error);
    console.error('Please check the error details above and fix any issues.');
    process.exit(1);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  testMemorySystem();
}

export { testMemorySystem };
