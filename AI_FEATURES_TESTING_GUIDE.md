# 🤖 AI Features Testing Guide

Complete guide to test all AI-powered features in your grocery store management system.

## 📋 Prerequisites

1. **MongoDB Running**: Ensure MongoDB is running locally or you have a MongoDB Atlas connection
2. **Environment Variables**: Check `.env.local` has `MONGODB_URI` configured
3. **Dev Server Running**: Run `npm run dev` (should be at http://localhost:3000)
4. **Login Credentials**: Have owner account credentials ready

## 🚀 Quick Start Testing

### Step 1: Seed Test Data (Recommended)

```bash
# Install ts-node if not already installed
npm install -g ts-node

# Run the seed script
npx ts-node scripts/seed-ai-test-data.ts
```

This will populate your database with:
- 3 suppliers
- 8 products (varying stock levels)
- 5 customers (different engagement levels)
- 200+ sales records (60 days of history)
- 2 purchase orders

### Step 2: Login as Owner

1. Navigate to http://localhost:3000/login
2. Login with your owner account credentials
3. You should see the owner dashboard

### Step 3: Access AI Insights

Click on **🤖 AI Insights** in the sidebar navigation

---

## 🧪 Testing Each AI Feature

### 1. 📦 Smart Reordering (Automated Inventory Management)

**What it does**: Analyzes stock levels and calculates optimal reorder quantities using Economic Order Quantity (EOQ) formula.

**How to test**:

1. Go to **AI Insights** → **Smart Reordering** tab
2. You should see:
   - Products with **critical** urgency (red badge) - immediate reorder needed
   - Products with **high** urgency (orange badge) - reorder soon
   - **Optimal order quantity** calculated per product
   - **Days until stockout** prediction
   - **Estimated cost** for reorder

**Expected Results**:
```
✅ "Organic Milk 1L" - Critical urgency (5 units left, needs 100)
✅ "Whole Wheat Bread" - High urgency (12 units left, needs 50)
✅ Each product shows specific reorder recommendation
```

**Manual Testing**:
```bash
# Test the API directly
curl http://localhost:3000/api/ai/smart-reorder
```

**What makes it "AI"**: Uses demand forecasting, safety stock calculations, and lead time analysis to predict exact reorder points.

---

### 2. 💰 Price Optimization (Dynamic Pricing)

**What it does**: Analyzes sales velocity and suggests price adjustments to maximize revenue while protecting margins.

**How to test**:

1. Go to **AI Insights** → **Price Optimization** tab
2. You should see:
   - **Fast-moving products** with price increase suggestions
   - **Slow-moving products** with price decrease suggestions
   - **Projected margin** after price change
   - **Reasoning** for each suggestion (e.g., "High velocity, can increase price")

**Expected Results**:
```
✅ "Potato Chips" - Suggest +5% increase (high demand)
✅ "Artisan Cheese" - Suggest -10% decrease (slow mover)
✅ Confidence scores: high/medium/low
```

**Manual Testing**:
```bash
# Test the API directly
curl http://localhost:3000/api/ai/price-optimization
```

**What makes it "AI"**: Velocity-based pricing algorithms that balance demand elasticity with margin protection.

---

### 3. 👤 Customer Churn Prediction (Retention Intelligence)

**What it does**: Analyzes customer behavior to predict who is likely to stop shopping and provides retention strategies.

**How to test**:

1. Go to **AI Insights** → **Churn Prediction** tab
2. You should see:
   - **High-risk customers** (red badge, 70-100% churn risk)
   - **Medium-risk customers** (yellow badge, 40-69% churn risk)
   - **Days since last visit** for each customer
   - **Personalized retention recommendations**

**Expected Results**:
```
✅ "Amit Patel" - High risk (75 days inactive, 85% churn risk)
✅ "Priya Sharma" - Medium risk (45 days inactive, 55% churn risk)
✅ Specific recommendations: "Send personalized discount offer"
```

**Manual Testing**:
```bash
# Test the API directly
curl http://localhost:3000/api/ai/churn-prediction
```

**What makes it "AI"**: Multi-factor risk scoring based on RFM (Recency, Frequency, Monetary) analysis.

---

### 4. 🎯 Personalized Recommendations (Collaborative Filtering)

**What it does**: Suggests products to customers based on purchase history and similar customer behavior.

**How to test**:

1. Get a customer ID from the Customers page
2. Test the API:

```bash
# Replace {customerId} with actual customer ID
curl http://localhost:3000/api/ai/recommendations?customerId={customerId}&limit=5
```

**Expected Results**:
```json
{
  "recommendations": [
    {
      "productName": "Coffee Beans",
      "reason": "Frequently bought with Milk",
      "score": 8.5
    }
  ]
}
```

**What makes it "AI"**: Collaborative filtering algorithm that finds patterns in purchase data to suggest relevant products.

---

### 5. 📈 Demand Forecasting (Sales Prediction)

**What it does**: Predicts future demand based on historical sales patterns.

**How to test**:

1. Test the API for a specific product:

```bash
# Replace {productId} with actual product ID
curl "http://localhost:3000/api/ai/demand-forecast?productId={productId}&daysAhead=30"
```

**Expected Results**:
```json
{
  "productName": "Organic Milk 1L",
  "forecast": [
    { "date": "2025-11-22", "predictedDemand": 15, "confidence": "high" },
    { "date": "2025-11-23", "predictedDemand": 14, "confidence": "high" }
  ]
}
```

**Note**: Demand forecasting is integrated into Smart Reordering tab.

**What makes it "AI"**: Time-series analysis with confidence scoring based on historical variance.

---

### 6. 🚨 Fraud Detection (Transaction Monitoring)

**What it does**: Analyzes transactions for suspicious patterns and anomalies.

**How to test**:

1. Test the API:

```bash
curl http://localhost:3000/api/ai/fraud-detection
```

**Expected Results**:
```json
{
  "alerts": [
    {
      "saleId": "...",
      "customerName": "John Doe",
      "amount": 25000,
      "riskScore": 85,
      "reasons": ["Unusually high transaction", "Multiple transactions in short time"]
    }
  ]
}
```

**Manual Test - Create Suspicious Transaction**:
1. Go to owner dashboard
2. Create a sale with amount > ₹10,000
3. Create another sale for same customer within 1 hour
4. Check fraud detection API - should flag as suspicious

**What makes it "AI"**: Anomaly detection using statistical analysis of transaction patterns, velocity checks, and baseline comparisons.

---

## 🎯 Complete Testing Workflow

### Scenario 1: Low Stock Alert → Reorder
1. Navigate to **AI Insights** → **Smart Reordering**
2. Identify critical stock items (red badge)
3. Click on product to view details
4. Create purchase order based on recommendation
5. Navigate to **Purchase Orders** page
6. Create new PO with suggested quantity

### Scenario 2: Optimize Pricing
1. Navigate to **AI Insights** → **Price Optimization**
2. Review price suggestions
3. Navigate to **Inventory** page
4. Update product prices based on suggestions
5. Monitor sales velocity changes

### Scenario 3: Retain At-Risk Customer
1. Navigate to **AI Insights** → **Churn Prediction**
2. Identify high-risk customers
3. Navigate to **Promotions** page
4. Create personalized discount code for at-risk customer
5. Send retention offer (email/SMS - outside scope)

---

## 🔍 Verification Checklist

- [ ] All 6 AI API endpoints return 200 status
- [ ] Smart Reordering shows products with low stock
- [ ] Price Optimization provides increase/decrease suggestions
- [ ] Churn Prediction identifies inactive customers
- [ ] Recommendations provide relevant products
- [ ] Demand Forecast shows future predictions
- [ ] Fraud Detection flags high-value transactions
- [ ] UI displays data correctly with proper formatting
- [ ] Urgency badges show correct colors (red/orange/green)
- [ ] All calculations are mathematically correct

---

## 🐛 Troubleshooting

### No data showing in AI Insights
**Fix**: Run the seed script to populate test data
```bash
npx ts-node scripts/seed-ai-test-data.ts
```

### API returns empty arrays
**Fix**: Ensure MongoDB is connected and has data
```bash
# Check MongoDB connection
mongosh
> show dbs
> use smart-cart
> db.products.countDocuments()
```

### TypeScript errors in seed script
**Fix**: Install dependencies
```bash
npm install --save-dev @types/node ts-node
```

### "Cannot find module" errors
**Fix**: Ensure all models are properly imported
```bash
npm run build
```

---

## 📊 Expected Performance Metrics

After seeding and testing, you should see:

| Feature | Response Time | Data Points |
|---------|--------------|-------------|
| Smart Reordering | < 500ms | 2-5 products |
| Price Optimization | < 800ms | 3-8 products |
| Churn Prediction | < 600ms | 1-3 customers |
| Recommendations | < 400ms | 5 products |
| Demand Forecast | < 700ms | 30 data points |
| Fraud Detection | < 300ms | 0-2 alerts |

---

## 🎓 Understanding the AI Algorithms

### Smart Reordering Algorithm
```typescript
EOQ = √(2 × Demand × OrderCost / HoldingCost)
SafetyStock = LeadTime × DailyDemand × SafetyFactor
ReorderPoint = SafetyStock + LeadTimeDemand
```

### Price Optimization Logic
```typescript
if (velocity > avgVelocity * 1.5) → increase price by 5-10%
if (velocity < avgVelocity * 0.5) → decrease price by 10-15%
Maintain minimum margin of 20%
```

### Churn Risk Scoring
```typescript
RiskScore = (DaysSinceVisit × 0.4) + (InactivityPeriod × 0.3) + (DecreasingSpend × 0.3)
High Risk: 70-100%
Medium Risk: 40-69%
Low Risk: 0-39%
```

---

## ✅ Success Criteria

Your AI features are working correctly if:

1. **Smart Reordering**: Identifies 2+ products needing reorder with specific quantities
2. **Price Optimization**: Suggests at least 3 price changes with valid reasoning
3. **Churn Prediction**: Flags 1-3 customers with risk scores
4. **Recommendations**: Returns 5+ relevant products per customer
5. **Demand Forecast**: Shows 30-day predictions with confidence levels
6. **Fraud Detection**: Correctly flags transactions >₹15,000 or unusual patterns

---

## 🚀 Next Steps

1. **Test with Real Data**: Replace seed data with actual sales data
2. **Fine-tune Algorithms**: Adjust thresholds based on your business needs
3. **Add Notifications**: Email/SMS alerts for critical insights
4. **Create Dashboards**: Visualize AI insights with charts
5. **Automate Actions**: Auto-create POs for critical stock items
6. **A/B Testing**: Test price optimizations and measure impact

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors (F12)
2. Review terminal logs for API errors
3. Verify MongoDB connection
4. Ensure all dependencies are installed
5. Check that seed data was created successfully

Happy Testing! 🎉
