# 🚀 Quick Start: Test AI Features in 5 Minutes

## Option 1: Instant Browser Testing (No Setup)

1. **Open your browser** to http://localhost:3000
2. **Login as owner**
3. **Open browser console** (Press F12 → Console tab)
4. **Copy-paste this entire code** and press Enter:

```javascript
async function quickTest() {
  const tests = [
    { name: 'Smart Reorder', url: '/api/ai/smart-reorder' },
    { name: 'Price Optimization', url: '/api/ai/price-optimization' },
    { name: 'Churn Prediction', url: '/api/ai/churn-prediction' },
    { name: 'Fraud Detection', url: '/api/ai/fraud-detection' }
  ];
  
  console.log('🤖 Testing AI Features...\n');
  
  for (const test of tests) {
    try {
      const res = await fetch(test.url);
      const data = await res.json();
      console.log(`✅ ${test.name}: ${res.ok ? 'WORKING' : 'FAILED'}`);
      console.log(data);
    } catch (err) {
      console.log(`❌ ${test.name}: ERROR - ${err.message}`);
    }
  }
  
  console.log('\n✨ Navigate to /owner/ai-insights to see the dashboard!');
}

quickTest();
```

5. **Check the results** - You should see ✅ for each feature
6. **Navigate to AI Insights**: Click **🤖 AI Insights** in the sidebar

---

## Option 2: With Test Data (Recommended)

### Step 1: Seed Database (One-time)
```bash
# Open a new terminal
npx ts-node scripts/seed-ai-test-data.ts
```

**What this does**:
- Creates 8 products with varying stock levels
- Adds 5 customers (some at risk of churning)
- Generates 200+ sales records (60 days of history)
- Creates 3 suppliers and 2 purchase orders

### Step 2: Access AI Insights
1. Go to http://localhost:3000/owner/ai-insights
2. Click through each tab:
   - **📦 Smart Reordering** - See products that need restocking
   - **💰 Price Optimization** - Get pricing suggestions
   - **👤 Churn Prediction** - Find at-risk customers
   - **📈 Demand Forecast** - View sales predictions

---

## Option 3: Manual API Testing

### Test Each Endpoint Individually:

```bash
# Terminal 1: Smart Reordering
curl http://localhost:3000/api/ai/smart-reorder

# Terminal 2: Price Optimization
curl http://localhost:3000/api/ai/price-optimization

# Terminal 3: Churn Prediction
curl http://localhost:3000/api/ai/churn-prediction

# Terminal 4: Fraud Detection
curl http://localhost:3000/api/ai/fraud-detection

# Terminal 5: Recommendations (replace with customer ID)
curl "http://localhost:3000/api/ai/recommendations?customerId=YOUR_CUSTOMER_ID&limit=5"

# Terminal 6: Demand Forecast (replace with product ID)
curl "http://localhost:3000/api/ai/demand-forecast?productId=YOUR_PRODUCT_ID&daysAhead=30"
```

---

## ✅ What You Should See

### Smart Reordering Tab
```
Critical: 1-2 products (red badge)
High: 1-2 products (orange badge)
Each showing:
  - Current stock
  - Optimal order quantity
  - Days until stockout
  - Estimated cost
```

### Price Optimization Tab
```
3-5 products with price suggestions:
  - Fast movers → price increase (+5-10%)
  - Slow movers → price decrease (-10-15%)
  - Confidence: high/medium/low
  - Reasoning for each
```

### Churn Prediction Tab
```
1-3 at-risk customers:
  - High risk (70-100%) - red badge
  - Medium risk (40-69%) - yellow badge
  - Days since last visit
  - Specific retention strategies
```

---

## 🐛 Troubleshooting

### "No data found" or empty results
**Solution**: Run the seed script first
```bash
npx ts-node scripts/seed-ai-test-data.ts
```

### "Cannot connect to database"
**Solution**: Check MongoDB is running
```bash
# Check if MongoDB is running
mongosh
# OR
mongo
```

### TypeScript errors when running seed script
**Solution**: Install dependencies
```bash
npm install --save-dev ts-node @types/node
```

### 404 errors on API calls
**Solution**: Restart dev server
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## 🎯 Quick Verification Checklist

- [ ] Can access http://localhost:3000/owner/ai-insights
- [ ] Smart Reordering tab loads and shows data
- [ ] Price Optimization tab shows suggestions
- [ ] Churn Prediction tab displays customers
- [ ] No console errors (F12 → Console)
- [ ] All API endpoints return 200 status
- [ ] Data displays correctly with colors and badges

---

## 📊 Expected Results After Seeding

| Feature | Expected Output |
|---------|----------------|
| Smart Reordering | 2-4 products needing reorder |
| Price Optimization | 4-6 pricing suggestions |
| Churn Prediction | 2-3 at-risk customers |
| Fraud Detection | 0-2 suspicious transactions |
| Recommendations | 5+ products per customer |
| Demand Forecast | 30 days of predictions |

---

## 🎉 Success!

If you see data in all tabs, **congratulations!** All AI features are working.

**Next Steps**:
1. Test with your own real data
2. Adjust thresholds in `src/lib/ai-features.ts`
3. Create automated alerts for critical items
4. Integrate recommendations into product pages

---

## 📞 Still Having Issues?

1. Check browser console (F12) for JavaScript errors
2. Check terminal for Node.js/API errors
3. Verify `.env.local` has correct `MONGODB_URI`
4. Ensure all dependencies installed: `npm install`
5. Try rebuilding: `npm run build && npm run dev`

**Most Common Fix**: Just run the seed script!
```bash
npx ts-node scripts/seed-ai-test-data.ts
```
