// Quick Diagnostic Script - Check Smart Reordering Status
// Paste this in browser console (F12) on http://localhost:3000/owner/ai-insights

(async function checkSmartReordering() {
  console.clear();
  console.log('🔍 SMART REORDERING DIAGNOSTIC\n' + '='.repeat(60));
  
  try {
    // Test the API
    const response = await fetch('/api/ai/smart-reorder');
    const data = await response.json();
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Total products needing reorder: ${data.totalProducts}`);
    console.log(`   Critical urgency: ${data.critical}`);
    console.log(`   High urgency: ${data.high}`);
    console.log(`   Normal urgency: ${data.totalProducts - data.critical - data.high}`);
    
    if (data.recommendations && data.recommendations.length > 0) {
      console.log('\n📦 PRODUCTS NEEDING REORDER:\n');
      
      data.recommendations.forEach((item, index) => {
        const icon = item.urgency === 'critical' ? '🔴' : 
                     item.urgency === 'high' ? '🟠' : '🟢';
        
        console.log(`${icon} ${index + 1}. ${item.productName}`);
        console.log(`   Current Stock: ${item.currentStock} units`);
        console.log(`   Reorder Point: ${item.reorderPoint} units`);
        console.log(`   Order Quantity: ${item.optimalOrderQuantity} units`);
        console.log(`   Daily Demand: ${item.dailyDemand} units/day`);
        console.log(`   Days Until Stockout: ${item.daysUntilStockout} days`);
        console.log(`   Urgency: ${item.urgency.toUpperCase()}`);
        console.log(`   Estimated Cost: ₹${item.estimatedCost.toFixed(2)}`);
        console.log(`   Recommendation: ${item.recommendation}\n`);
      });
      
      console.log('✅ Smart Reordering is working correctly!');
      console.log('Navigate to the Smart Reordering tab to see visual display.');
    } else {
      console.log('\n⚠️ No products currently need reordering.');
      console.log('This means all products have sufficient stock.');
      
      // Check inventory to see current stock levels
      console.log('\n🔍 Checking current inventory...');
      const invResponse = await fetch('/api/inventory');
      const invData = await invResponse.json();
      
      if (invData.products) {
        console.log('\n📦 CURRENT INVENTORY STATUS:');
        invData.products.forEach(product => {
          const reorderPoint = product.reorderPoint || product.lowStockThreshold || 20;
          const isLow = product.stockQuantity <= reorderPoint;
          const icon = isLow ? '⚠️' : '✅';
          
          console.log(`${icon} ${product.name}`);
          console.log(`   Stock: ${product.stockQuantity || 0} units`);
          console.log(`   Reorder Point: ${reorderPoint} units`);
          console.log(`   Status: ${isLow ? 'LOW STOCK - Should trigger reorder' : 'Sufficient'}\n`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('💡 TIP: If low stock items are not showing:');
    console.log('   1. Check that products have reorderPoint configured');
    console.log('   2. Verify stockQuantity is below reorderPoint');
    console.log('   3. Ensure MongoDB connection is working');
    console.log('   4. Try refreshing the page');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure you are logged in as owner');
    console.log('   2. Check that dev server is running (npm run dev)');
    console.log('   3. Verify MongoDB is connected');
    console.log('   4. Check browser console for other errors');
  }
})();
