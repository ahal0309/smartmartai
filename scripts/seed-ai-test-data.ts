/**
 * Seed Script for AI Features Testing
 * Run this to populate your database with realistic test data
 * 
 * Usage: npx ts-node scripts/seed-ai-test-data.ts
 */

import mongoose from 'mongoose';
import Product from '../src/models/Product';
import Sale from '../src/models/Sale';
import Customer from '../src/models/Customer';
import PurchaseOrder from '../src/models/PurchaseOrder';
import Supplier from '../src/models/Supplier';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-cart';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await Product.deleteMany({});
    // await Sale.deleteMany({});
    // await Customer.deleteMany({});
    // await PurchaseOrder.deleteMany({});
    // await Supplier.deleteMany({});
    // console.log('🗑️  Cleared existing data');

    // 1. Create Suppliers
    console.log('\n📦 Creating suppliers...');
    const suppliers = await Supplier.create([
      {
        name: 'Fresh Farms Ltd',
        contactPerson: 'John Smith',
        email: 'john@freshfarms.com',
        phone: '+91-9876543210',
        address: '123 Farm Road, Mumbai',
        paymentTerms: 'Net 30',
        rating: 4.5,
        status: 'active'
      },
      {
        name: 'Dairy Best Co',
        contactPerson: 'Sarah Johnson',
        email: 'sarah@dairybest.com',
        phone: '+91-9876543211',
        address: '456 Milk Street, Delhi',
        paymentTerms: 'Net 15',
        rating: 4.8,
        status: 'active'
      },
      {
        name: 'Snack World Distributors',
        contactPerson: 'Mike Brown',
        email: 'mike@snackworld.com',
        phone: '+91-9876543212',
        address: '789 Snack Avenue, Bangalore',
        paymentTerms: 'Net 45',
        rating: 4.2,
        status: 'active'
      }
    ]);
    console.log(`✅ Created ${suppliers.length} suppliers`);

    // 2. Create Products with varying stock levels
    console.log('\n📦 Creating products...');
    const products = await Product.create([
      // Critical stock - needs immediate reorder
      {
        name: 'Organic Milk 1L',
        description: 'Fresh organic milk',
        price: 65,
        costPrice: 45,
        category: 'Dairy',
        stockQuantity: 5,
        reorderPoint: 20,
        reorderQuantity: 100,
        supplierIds: [suppliers[1]._id],
        sku: 'MILK-ORG-1L',
        barcode: '8901234567890',
        imageUrl: 'https://example.com/milk.jpg'
      },
      // High priority reorder
      {
        name: 'Whole Wheat Bread',
        description: 'Fresh whole wheat bread',
        price: 45,
        costPrice: 30,
        category: 'Bakery',
        stockQuantity: 12,
        reorderPoint: 15,
        reorderQuantity: 50,
        supplierIds: [suppliers[0]._id],
        sku: 'BREAD-WW',
        barcode: '8901234567891'
      },
      // Normal stock - good seller
      {
        name: 'Premium Coffee Beans 500g',
        description: 'Arabica coffee beans',
        price: 450,
        costPrice: 300,
        category: 'Beverages',
        stockQuantity: 50,
        reorderPoint: 20,
        reorderQuantity: 30,
        supplierIds: [suppliers[0]._id],
        sku: 'COFFEE-PREM-500G',
        barcode: '8901234567892'
      },
      // Fast moving - for price optimization testing
      {
        name: 'Potato Chips Family Pack',
        description: 'Crispy potato chips',
        price: 85,
        costPrice: 50,
        category: 'Snacks',
        stockQuantity: 120,
        reorderPoint: 30,
        reorderQuantity: 100,
        supplierIds: [suppliers[2]._id],
        sku: 'CHIPS-FAM',
        barcode: '8901234567893'
      },
      // Slow moving - for price optimization testing
      {
        name: 'Artisan Cheese 200g',
        description: 'Premium imported cheese',
        price: 350,
        costPrice: 250,
        category: 'Dairy',
        stockQuantity: 80,
        reorderPoint: 10,
        reorderQuantity: 20,
        supplierIds: [suppliers[1]._id],
        sku: 'CHEESE-ART-200G',
        barcode: '8901234567894'
      },
      // Additional products for variety
      {
        name: 'Fresh Orange Juice 1L',
        description: 'Freshly squeezed orange juice',
        price: 120,
        costPrice: 80,
        category: 'Beverages',
        stockQuantity: 35,
        reorderPoint: 15,
        reorderQuantity: 40,
        supplierIds: [suppliers[0]._id],
        sku: 'JUICE-ORA-1L',
        barcode: '8901234567895'
      },
      {
        name: 'Brown Rice 5kg',
        description: 'Organic brown rice',
        price: 450,
        costPrice: 320,
        category: 'Grains',
        stockQuantity: 25,
        reorderPoint: 10,
        reorderQuantity: 30,
        supplierIds: [suppliers[0]._id],
        sku: 'RICE-BRN-5KG',
        barcode: '8901234567896'
      },
      {
        name: 'Dark Chocolate Bar 100g',
        description: 'Premium dark chocolate',
        price: 180,
        costPrice: 120,
        category: 'Snacks',
        stockQuantity: 60,
        reorderPoint: 20,
        reorderQuantity: 50,
        supplierIds: [suppliers[2]._id],
        sku: 'CHOC-DARK-100G',
        barcode: '8901234567897'
      }
    ]);
    console.log(`✅ Created ${products.length} products`);

    // 3. Create Customers with varying engagement levels
    console.log('\n👥 Creating customers...');
    const today = new Date();
    const customers = await Customer.create([
      // Active loyal customer
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@email.com',
        phone: '+91-9876543220',
        address: '12 MG Road, Mumbai',
        loyaltyPoints: 1250,
        totalPurchases: 28500,
        segment: 'premium',
        lastVisit: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: 'active'
      },
      // At-risk customer - hasn't visited in 45 days
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@email.com',
        phone: '+91-9876543221',
        address: '45 Park Street, Delhi',
        loyaltyPoints: 450,
        totalPurchases: 15600,
        segment: 'regular',
        lastVisit: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        status: 'active'
      },
      // High-risk churning customer
      {
        name: 'Amit Patel',
        email: 'amit.patel@email.com',
        phone: '+91-9876543222',
        address: '78 Lake View, Bangalore',
        loyaltyPoints: 180,
        totalPurchases: 8200,
        segment: 'regular',
        lastVisit: new Date(today.getTime() - 75 * 24 * 60 * 60 * 1000), // 75 days ago
        status: 'active'
      },
      // New active customer
      {
        name: 'Sneha Reddy',
        email: 'sneha.reddy@email.com',
        phone: '+91-9876543223',
        address: '90 Tech Park, Hyderabad',
        loyaltyPoints: 320,
        totalPurchases: 5600,
        segment: 'regular',
        lastVisit: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: 'active'
      },
      // Budget customer
      {
        name: 'Vikram Singh',
        email: 'vikram.singh@email.com',
        phone: '+91-9876543224',
        address: '23 Station Road, Pune',
        loyaltyPoints: 95,
        totalPurchases: 3200,
        segment: 'budget',
        lastVisit: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        status: 'active'
      }
    ]);
    console.log(`✅ Created ${customers.length} customers`);

    // 4. Create Historical Sales (last 60 days)
    console.log('\n💰 Creating sales data...');
    const sales = [];
    
    // Generate daily sales for the past 60 days
    for (let daysAgo = 60; daysAgo >= 0; daysAgo--) {
      const saleDate = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Create 3-8 sales per day
      const salesPerDay = Math.floor(Math.random() * 6) + 3;
      
      for (let i = 0; i < salesPerDay; i++) {
        const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
        const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items per sale
        
        const items = [];
        let totalAmount = 0;
        
        for (let j = 0; j < numItems; j++) {
          const randomProduct = products[Math.floor(Math.random() * products.length)];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
          const price = randomProduct.price;
          
          items.push({
            productId: randomProduct._id,
            productName: randomProduct.name,
            quantity,
            price,
            total: quantity * price
          });
          
          totalAmount += quantity * price;
        }
        
        // Add some high-value sales for fraud detection testing
        if (Math.random() < 0.05 && daysAgo < 2) {
          totalAmount = Math.floor(Math.random() * 20000) + 15000; // ₹15,000 - ₹35,000
        }
        
        sales.push({
          customerId: randomCustomer._id,
          customerName: randomCustomer.name,
          items,
          totalAmount,
          paymentMethod: ['cash', 'card', 'upi'][Math.floor(Math.random() * 3)],
          status: 'completed',
          saleDate
        });
      }
    }
    
    await Sale.insertMany(sales);
    console.log(`✅ Created ${sales.length} sales records`);

    // 5. Create Purchase Orders
    console.log('\n📋 Creating purchase orders...');
    const purchaseOrders = await PurchaseOrder.create([
      {
        supplierId: suppliers[0]._id,
        supplierName: suppliers[0].name,
        items: [
          {
            productId: products[0]._id,
            productName: products[0].name,
            quantity: 100,
            unitPrice: 45,
            total: 4500
          }
        ],
        totalAmount: 4500,
        status: 'pending',
        expectedDelivery: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        supplierId: suppliers[1]._id,
        supplierName: suppliers[1].name,
        items: [
          {
            productId: products[4]._id,
            productName: products[4].name,
            quantity: 20,
            unitPrice: 250,
            total: 5000
          }
        ],
        totalAmount: 5000,
        status: 'approved',
        expectedDelivery: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log(`✅ Created ${purchaseOrders.length} purchase orders`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${suppliers.length} suppliers`);
    console.log(`   - ${products.length} products`);
    console.log(`   - ${customers.length} customers`);
    console.log(`   - ${sales.length} sales records`);
    console.log(`   - ${purchaseOrders.length} purchase orders`);
    
    console.log('\n✅ You can now test the AI features:');
    console.log('   1. Smart Reordering - Check products with low stock');
    console.log('   2. Price Optimization - See pricing suggestions');
    console.log('   3. Churn Prediction - View at-risk customers');
    console.log('   4. Demand Forecasting - Analyze sales trends');
    console.log('   5. Fraud Detection - Review recent high-value transactions');
    console.log('   6. Recommendations - Get personalized product suggestions');
    
    console.log('\n🌐 Navigate to: http://localhost:3000/owner/ai-insights');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

seedData();
