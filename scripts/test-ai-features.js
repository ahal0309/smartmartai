/**
 * Quick Test Script for AI Features
 * 
 * Copy and paste this in your browser console (F12) while on the owner dashboard
 * This will test all AI endpoints and display results
 */

async function testAllAIFeatures() {
  console.log('🤖 Starting AI Features Test Suite...\n');
  
  const baseUrl = 'http://localhost:3000/api/ai';
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Smart Reordering
  console.log('1️⃣ Testing Smart Reordering...');
  try {
    const response = await fetch(`${baseUrl}/smart-reorder`);
    const data = await response.json();
    
    if (response.ok && data.recommendations) {
      console.log('✅ Smart Reordering works!');
      console.log(`   Found ${data.recommendations.length} products needing reorder`);
      console.log(`   Critical: ${data.critical}, High: ${data.high}, Normal: ${data.normal}`);
      results.passed++;
      results.tests.push({ name: 'Smart Reordering', status: 'PASS', data });
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    console.error('❌ Smart Reordering failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Smart Reordering', status: 'FAIL', error: error.message });
  }

  // Test 2: Price Optimization
  console.log('\n2️⃣ Testing Price Optimization...');
  try {
    const response = await fetch(`${baseUrl}/price-optimization`);
    const data = await response.json();
    
    if (response.ok && data.optimizations) {
      console.log('✅ Price Optimization works!');
      console.log(`   Found ${data.optimizations.length} pricing suggestions`);
      console.log(`   Increases: ${data.priceIncreases}, Decreases: ${data.priceDecreases}`);
      results.passed++;
      results.tests.push({ name: 'Price Optimization', status: 'PASS', data });
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    console.error('❌ Price Optimization failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Price Optimization', status: 'FAIL', error: error.message });
  }

  // Test 3: Churn Prediction
  console.log('\n3️⃣ Testing Churn Prediction...');
  try {
    const response = await fetch(`${baseUrl}/churn-prediction`);
    const data = await response.json();
    
    if (response.ok && data.predictions) {
      console.log('✅ Churn Prediction works!');
      console.log(`   Analyzed ${data.summary?.totalAnalyzed || 0} customers`);
      console.log(`   High Risk: ${data.summary?.highRisk || 0}, Medium: ${data.summary?.mediumRisk || 0}`);
      results.passed++;
      results.tests.push({ name: 'Churn Prediction', status: 'PASS', data });
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    console.error('❌ Churn Prediction failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Churn Prediction', status: 'FAIL', error: error.message });
  }

  // Test 4: Fraud Detection
  console.log('\n4️⃣ Testing Fraud Detection...');
  try {
    const response = await fetch(`${baseUrl}/fraud-detection`);
    const data = await response.json();
    
    if (response.ok && data.alerts !== undefined) {
      console.log('✅ Fraud Detection works!');
      console.log(`   Found ${data.alerts.length} suspicious transactions`);
      console.log(`   Analyzed: ${data.totalAnalyzed}, Flagged: ${data.flagged}`);
      results.passed++;
      results.tests.push({ name: 'Fraud Detection', status: 'PASS', data });
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    console.error('❌ Fraud Detection failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Fraud Detection', status: 'FAIL', error: error.message });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}/4`);
  console.log(`❌ Failed: ${results.failed}/4`);
  console.log(`📈 Success Rate: ${(results.passed / 4 * 100).toFixed(0)}%`);
  console.log('='.repeat(60));

  if (results.passed === 4) {
    console.log('\n🎉 All AI features are working perfectly!');
    console.log('Navigate to: http://localhost:3000/owner/ai-insights');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.');
    console.log('Make sure:');
    console.log('  1. MongoDB is running and connected');
    console.log('  2. You have run the seed script: npx ts-node scripts/seed-ai-test-data.ts');
    console.log('  3. All models are properly configured');
  }

  return results;
}

// Run the tests
testAllAIFeatures();
