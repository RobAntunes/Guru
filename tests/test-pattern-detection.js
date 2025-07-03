#!/usr/bin/env node

/**
 * Test Pattern Detection - Comprehensive validation of design patterns and anti-pattern detection
 */

import { GuruCore } from '../src/core/guru.js';
import fs from 'fs';
import path from 'path';

// Test samples with known patterns
const testSamples = {
  // Singleton pattern example
  singletonExample: `
class DatabaseManager {
  constructor() {
    if (DatabaseManager.instance) {
      throw new Error('Use DatabaseManager.getInstance()');
    }
    this.connection = null;
  }
  
  static getInstance() {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }
  
  connect() {
    this.connection = createConnection();
  }
}
`,

  // Factory pattern example
  factoryExample: `
class ShapeFactory {
  createShape(type) {
    switch(type) {
      case 'circle':
        return new Circle();
      case 'square':
        return new Square();
      case 'triangle':
        return new Triangle();
      default:
        throw new Error('Unknown shape type');
    }
  }
}

function createAnimal(type) {
  if (type === 'dog') return new Dog();
  if (type === 'cat') return new Cat();
  if (type === 'bird') return new Bird();
  return null;
}
`,

  // Observer pattern example
  observerExample: `
class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }
  
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  unsubscribe(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }
  
  notify(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}
`,

  // God Object anti-pattern example
  godObjectExample: `
class UserManager {
  constructor() {
    this.users = [];
    this.sessions = [];
    this.permissions = [];
    this.notifications = [];
    this.settings = [];
    this.cache = new Map();
    this.logger = new Logger();
    this.validator = new Validator();
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.paymentProcessor = new PaymentProcessor();
    this.reportGenerator = new ReportGenerator();
    this.fileUploader = new FileUploader();
    this.imageProcessor = new ImageProcessor();
    this.searchEngine = new SearchEngine();
  }
  
  // User management
  createUser(userData) { /* ... */ }
  updateUser(userId, data) { /* ... */ }
  deleteUser(userId) { /* ... */ }
  getUserById(userId) { /* ... */ }
  getUserByEmail(email) { /* ... */ }
  
  // Session management
  createSession(userId) { /* ... */ }
  validateSession(sessionId) { /* ... */ }
  destroySession(sessionId) { /* ... */ }
  
  // Permission management
  grantPermission(userId, permission) { /* ... */ }
  revokePermission(userId, permission) { /* ... */ }
  checkPermission(userId, permission) { /* ... */ }
  
  // Notification management
  sendNotification(userId, message) { /* ... */ }
  markAsRead(notificationId) { /* ... */ }
  getUnreadCount(userId) { /* ... */ }
  
  // Settings management
  updateSettings(userId, settings) { /* ... */ }
  getSettings(userId) { /* ... */ }
  resetSettings(userId) { /* ... */ }
  
  // Cache management
  cacheUser(userId, userData) { /* ... */ }
  getCachedUser(userId) { /* ... */ }
  invalidateCache(userId) { /* ... */ }
  
  // Validation
  validateEmail(email) { /* ... */ }
  validatePassword(password) { /* ... */ }
  validateUserData(userData) { /* ... */ }
  
  // Communication
  sendWelcomeEmail(userId) { /* ... */ }
  sendPasswordReset(email) { /* ... */ }
  sendSMS(phoneNumber, message) { /* ... */ }
  
  // Payment processing
  processPayment(userId, amount) { /* ... */ }
  refundPayment(paymentId) { /* ... */ }
  getPaymentHistory(userId) { /* ... */ }
  
  // Reporting
  generateUserReport(userId) { /* ... */ }
  generateActivityReport(timeRange) { /* ... */ }
  exportUserData(userId) { /* ... */ }
  
  // File management
  uploadProfileImage(userId, file) { /* ... */ }
  resizeImage(imagePath, dimensions) { /* ... */ }
  deleteFile(filePath) { /* ... */ }
  
  // Search functionality
  searchUsers(query) { /* ... */ }
  indexUser(userId) { /* ... */ }
  updateSearchIndex() { /* ... */ }
}
`,

  // Long method anti-pattern example
  longMethodExample: `
function processOrderComplete(orderData) {
  // Validate order data
  if (!orderData || !orderData.id) {
    throw new Error('Invalid order data');
  }
  if (!orderData.customer || !orderData.customer.email) {
    throw new Error('Customer email required');
  }
  if (!orderData.items || orderData.items.length === 0) {
    throw new Error('Order must have items');
  }
  
  // Validate each item
  for (const item of orderData.items) {
    if (!item.id || !item.name || !item.price) {
      throw new Error('Invalid item data');
    }
    if (item.quantity <= 0) {
      throw new Error('Item quantity must be positive');
    }
    if (item.price < 0) {
      throw new Error('Item price cannot be negative');
    }
  }
  
  // Calculate totals
  let subtotal = 0;
  let tax = 0;
  let shipping = 0;
  let discount = 0;
  
  for (const item of orderData.items) {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    
    // Apply item-specific discounts
    if (item.category === 'electronics' && itemTotal > 500) {
      discount += itemTotal * 0.1;
    } else if (item.category === 'clothing' && itemTotal > 200) {
      discount += itemTotal * 0.05;
    }
  }
  
  // Calculate tax based on location
  if (orderData.shippingAddress.country === 'US') {
    const stateTaxRates = {
      'CA': 0.0875, 'NY': 0.08, 'TX': 0.0625, 'FL': 0.06
    };
    tax = subtotal * (stateTaxRates[orderData.shippingAddress.state] || 0.05);
  } else if (orderData.shippingAddress.country === 'CA') {
    tax = subtotal * 0.13; // HST
  } else {
    tax = subtotal * 0.20; // Default international VAT
  }
  
  // Calculate shipping
  if (subtotal > 100) {
    shipping = 0; // Free shipping
  } else if (orderData.shippingMethod === 'express') {
    shipping = 25;
  } else if (orderData.shippingMethod === 'standard') {
    shipping = 10;
  } else {
    shipping = 5; // Economy
  }
  
  // Apply customer-level discounts
  if (orderData.customer.membershipLevel === 'premium') {
    discount += subtotal * 0.05;
  } else if (orderData.customer.membershipLevel === 'gold') {
    discount += subtotal * 0.03;
  }
  
  // Apply coupon codes
  if (orderData.couponCode) {
    const coupon = validateCouponCode(orderData.couponCode);
    if (coupon && coupon.isValid) {
      if (coupon.type === 'percentage') {
        discount += subtotal * (coupon.value / 100);
      } else if (coupon.type === 'fixed') {
        discount += coupon.value;
      }
    }
  }
  
  const total = subtotal + tax + shipping - discount;
  
  // Process payment
  const paymentResult = processPayment({
    amount: total,
    currency: orderData.currency || 'USD',
    paymentMethod: orderData.paymentMethod,
    customerInfo: orderData.customer
  });
  
  if (!paymentResult.success) {
    throw new Error('Payment failed: ' + paymentResult.error);
  }
  
  // Update inventory
  for (const item of orderData.items) {
    const currentStock = getInventoryLevel(item.id);
    if (currentStock < item.quantity) {
      // Partial fulfillment logic
      if (currentStock > 0) {
        updateInventoryLevel(item.id, 0);
        createBackorderItem(orderData.id, item.id, item.quantity - currentStock);
      } else {
        createBackorderItem(orderData.id, item.id, item.quantity);
      }
    } else {
      updateInventoryLevel(item.id, currentStock - item.quantity);
    }
  }
  
  // Send notifications
  sendOrderConfirmationEmail(orderData.customer.email, {
    orderId: orderData.id,
    total: total,
    items: orderData.items,
    estimatedDelivery: calculateDeliveryDate(orderData.shippingMethod)
  });
  
  // SMS notification if phone provided
  if (orderData.customer.phone) {
    sendSMSNotification(orderData.customer.phone, 
      \`Order #\${orderData.id} confirmed. Total: $\${total.toFixed(2)}\`);
  }
  
  // Create order record
  const orderRecord = {
    id: orderData.id,
    customerId: orderData.customer.id,
    items: orderData.items,
    subtotal: subtotal,
    tax: tax,
    shipping: shipping,
    discount: discount,
    total: total,
    status: 'confirmed',
    paymentId: paymentResult.transactionId,
    createdAt: new Date(),
    estimatedDelivery: calculateDeliveryDate(orderData.shippingMethod)
  };
  
  saveOrderToDatabase(orderRecord);
  
  // Update customer statistics
  updateCustomerStats(orderData.customer.id, {
    totalOrders: getCurrentOrderCount(orderData.customer.id) + 1,
    totalSpent: getCurrentSpentAmount(orderData.customer.id) + total,
    lastOrderDate: new Date()
  });
  
  // Analytics tracking
  trackOrderEvent('order_completed', {
    orderId: orderData.id,
    customerId: orderData.customer.id,
    revenue: total,
    itemCount: orderData.items.length,
    category: getMostExpensiveItemCategory(orderData.items)
  });
  
  return orderRecord;
}
`,

  // Long parameter list example
  longParameterExample: `
function createUserAccount(
  firstName, lastName, email, password, confirmPassword,
  dateOfBirth, gender, phoneNumber, address, city, state,
  zipCode, country, marketingOptIn, termsAccepted,
  newsletterSubscription, preferredLanguage, timezone,
  securityQuestion, securityAnswer, referralCode
) {
  // Implementation here
  return {
    firstName, lastName, email, password, confirmPassword,
    dateOfBirth, gender, phoneNumber, address, city, state,
    zipCode, country, marketingOptIn, termsAccepted,
    newsletterSubscription, preferredLanguage, timezone,
    securityQuestion, securityAnswer, referralCode
  };
}
`
};

async function createTestFile(name, content) {
  const filePath = path.join('temp-test-files', `${name}.js`);
  await fs.promises.mkdir('temp-test-files', { recursive: true });
  await fs.promises.writeFile(filePath, content);
  return filePath;
}

async function cleanupTestFiles() {
  try {
    await fs.promises.rmdir('temp-test-files', { recursive: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

async function testPatternDetection() {
  console.log('🔍 Testing Pattern Detection System...\n');
  
  const guru = new GuruCore();
  
  try {
    // Create test files
    console.log('📁 Creating test files...');
    const testFiles = {};
    for (const [name, content] of Object.entries(testSamples)) {
      testFiles[name] = await createTestFile(name, content);
      console.log(`   ✅ Created ${name}.js`);
    }
    
    // Analyze the test files
    console.log('\n🧠 Analyzing test codebase...');
    const analysis = await guru.analyzeCodebase({
      path: 'temp-test-files',
      language: 'javascript',
      includeTests: false
    });
    
    const patternAnalysis = analysis.patternAnalysis;
    
    if (!patternAnalysis) {
      console.error('❌ No pattern analysis found in results');
      return;
    }
    
    console.log('\n🎨 DESIGN PATTERNS DETECTED:');
    console.log('==========================================');
    
    if (patternAnalysis.designPatterns.length === 0) {
      console.log('   No design patterns detected');
    } else {
      patternAnalysis.designPatterns.forEach(pattern => {
        console.log(`\n📐 ${pattern.name} (${(pattern.confidence * 100).toFixed(1)}% confidence)`);
        console.log(`   Type: ${pattern.type}`);
        console.log(`   Description: ${pattern.description}`);
        console.log(`   Location: ${pattern.location.primaryFile}`);
        console.log(`   Participants:`);
        pattern.participants.forEach(p => {
          console.log(`     - ${p.role}: ${p.symbolName}`);
        });
        console.log(`   Benefits:`);
        pattern.benefits.forEach(benefit => {
          console.log(`     • ${benefit}`);
        });
        if (pattern.evidence.length > 0) {
          console.log(`   Evidence:`);
          pattern.evidence.forEach(evidence => {
            console.log(`     • ${evidence.description} (${(evidence.strength * 100).toFixed(0)}% strength)`);
          });
        }
      });
    }
    
    console.log('\n⚠️  ANTI-PATTERNS DETECTED:');
    console.log('==========================================');
    
    if (patternAnalysis.antiPatterns.length === 0) {
      console.log('   No anti-patterns detected');
    } else {
      patternAnalysis.antiPatterns.forEach(antiPattern => {
        console.log(`\n🚨 ${antiPattern.name} - ${antiPattern.severity.toUpperCase()} (${(antiPattern.confidence * 100).toFixed(1)}% confidence)`);
        console.log(`   Type: ${antiPattern.type}`);
        console.log(`   Description: ${antiPattern.description}`);
        console.log(`   Location: ${antiPattern.location.primaryFile}`);
        if (antiPattern.location.lineRange) {
          console.log(`   Lines: ${antiPattern.location.lineRange.start}-${antiPattern.location.lineRange.end}`);
        }
        console.log(`   Issues:`);
        antiPattern.issues.forEach(issue => {
          console.log(`     • ${issue}`);
        });
        console.log(`   Suggested Refactoring:`);
        antiPattern.suggestedRefactoring.forEach(suggestion => {
          console.log(`     💡 ${suggestion}`);
        });
        if (antiPattern.evidence.length > 0) {
          console.log(`   Evidence:`);
          antiPattern.evidence.forEach(evidence => {
            console.log(`     • ${evidence.description} (${(evidence.strength * 100).toFixed(0)}% strength)`);
          });
        }
      });
    }
    
    console.log('\n👃 CODE SMELLS DETECTED:');
    console.log('==========================================');
    
    if (patternAnalysis.codeSmells.length === 0) {
      console.log('   No code smells detected');
    } else {
      patternAnalysis.codeSmells.forEach(smell => {
        console.log(`\n💨 ${smell.name} - ${smell.severity.toUpperCase()} (${(smell.confidence * 100).toFixed(1)}% confidence)`);
        console.log(`   Type: ${smell.type}`);
        console.log(`   Description: ${smell.description}`);
        console.log(`   Location: ${smell.location?.primaryFile || 'Multiple files'}`);
        if (smell.refactoringHints.length > 0) {
          console.log(`   Refactoring Hints:`);
          smell.refactoringHints.forEach(hint => {
            console.log(`     💡 ${hint}`);
          });
        }
      });
    }
    
    console.log('\n💡 PATTERN-BASED RECOMMENDATIONS:');
    console.log('==========================================');
    
    if (patternAnalysis.recommendations.length === 0) {
      console.log('   No specific recommendations generated');
    } else {
      patternAnalysis.recommendations.forEach(rec => {
        console.log(`\n🎯 ${rec.title} - ${rec.priority.toUpperCase()} priority`);
        console.log(`   Type: ${rec.type}`);
        console.log(`   Description: ${rec.description}`);
        console.log(`   Effort: ${rec.effort}`);
        console.log(`   Benefits:`);
        rec.benefits.forEach(benefit => {
          console.log(`     • ${benefit}`);
        });
        if (rec.steps.length > 0) {
          console.log(`   Steps:`);
          rec.steps.forEach((step, index) => {
            console.log(`     ${index + 1}. ${step}`);
          });
        }
      });
    }
    
    console.log('\n📊 PATTERN ANALYSIS SUMMARY:');
    console.log('==========================================');
    console.log(`Total symbols analyzed: ${patternAnalysis.metadata.totalSymbols}`);
    console.log(`Design patterns found: ${patternAnalysis.metadata.patternsFound}`);
    console.log(`Anti-patterns found: ${patternAnalysis.metadata.antiPatternsFound}`);
    console.log(`Code smells found: ${patternAnalysis.metadata.codeSmellsFound}`);
    console.log(`Analysis time: ${patternAnalysis.metadata.analysisTime}ms`);
    console.log(`Average confidence: ${(patternAnalysis.metadata.confidence.average * 100).toFixed(1)}%`);
    
    console.log('\nConfidence distribution:');
    Object.entries(patternAnalysis.metadata.confidence.distribution).forEach(([range, count]) => {
      console.log(`   ${range}: ${count} detections`);
    });
    
    console.log('\n✅ Pattern detection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Pattern detection test failed:', error);
    console.error(error.stack);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test files...');
    await cleanupTestFiles();
  }
}

// Run the test
testPatternDetection().catch(console.error); 