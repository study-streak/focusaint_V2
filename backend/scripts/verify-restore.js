#!/usr/bin/env node

/**
 * Verify database restore integrity
 * Usage:
 *   node backend/scripts/verify-restore.js
 *   node backend/scripts/verify-restore.js --collection users
 *   node backend/scripts/verify-restore.js --detailed
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/focusaint';
const args = process.argv.slice(2);

const options = {
  collection: null,
  detailed: args.includes('--detailed'),
};

const collectionIndex = args.indexOf('--collection');
if (collectionIndex !== -1 && args[collectionIndex + 1]) {
  options.collection = args[collectionIndex + 1];
}

const EXPECTED_COLLECTIONS = [
  'users',
  'habitsessions',
  'habittasks',
  'streakrecords',
  'otps',
];

async function connectDatabase() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('✓ Connected to MongoDB\n');
}

async function verifyCollections() {
  console.log('=== Collection Verification ===\n');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);

  console.log(`Found ${collections.length} collections:`);
  collections.forEach(c => console.log(`  - ${c.name}`));
  console.log('');

  // Check for expected collections
  const missing = EXPECTED_COLLECTIONS.filter(name => !collectionNames.includes(name));
  
  if (missing.length > 0) {
    console.log('⚠️  Missing expected collections:');
    missing.forEach(name => console.log(`  - ${name}`));
    console.log('');
  } else {
    console.log('✓ All expected collections present\n');
  }

  return { collections: collectionNames, missing };
}

async function verifyDocumentCounts() {
  console.log('=== Document Count Verification ===\n');

  const db = mongoose.connection.db;
  const counts = {};

  for (const collectionName of EXPECTED_COLLECTIONS) {
    try {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      counts[collectionName] = count;
      console.log(`${collectionName.padEnd(20)} ${count.toLocaleString()} documents`);
    } catch (error) {
      console.log(`${collectionName.padEnd(20)} ERROR: ${error.message}`);
      counts[collectionName] = -1;
    }
  }

  console.log('');
  return counts;
}

async function verifyIndexes() {
  console.log('=== Index Verification ===\n');

  const db = mongoose.connection.db;
  const indexStatus = {};

  for (const collectionName of EXPECTED_COLLECTIONS) {
    try {
      const collection = db.collection(collectionName);
      const indexes = await collection.indexes();
      indexStatus[collectionName] = indexes.length;
      
      console.log(`${collectionName}:`);
      indexes.forEach(index => {
        const keys = Object.keys(index.key).join(', ');
        const unique = index.unique ? ' [UNIQUE]' : '';
        console.log(`  - ${index.name}: {${keys}}${unique}`);
      });
      console.log('');
    } catch (error) {
      console.log(`${collectionName}: ERROR - ${error.message}\n`);
      indexStatus[collectionName] = -1;
    }
  }

  return indexStatus;
}

async function verifyDataIntegrity() {
  console.log('=== Data Integrity Checks ===\n');

  const db = mongoose.connection.db;
  const issues = [];

  // Check for users without email
  try {
    const usersWithoutEmail = await db.collection('users').countDocuments({
      $or: [{ email: null }, { email: '' }]
    });
    
    if (usersWithoutEmail > 0) {
      issues.push(`Found ${usersWithoutEmail} users without email`);
      console.log(`⚠️  ${usersWithoutEmail} users without email`);
    } else {
      console.log('✓ All users have email addresses');
    }
  } catch (error) {
    console.log(`⚠️  Could not verify user emails: ${error.message}`);
  }

  // Check for orphaned sessions (sessions without valid user)
  try {
    const totalSessions = await db.collection('habitsessions').countDocuments();
    const users = await db.collection('users').find({}, { projection: { _id: 1 } }).toArray();
    const userIds = users.map(u => u._id.toString());
    
    const orphanedSessions = await db.collection('habitsessions').countDocuments({
      userId: { $nin: userIds.map(id => new mongoose.Types.ObjectId(id)) }
    });

    if (orphanedSessions > 0) {
      issues.push(`Found ${orphanedSessions} orphaned sessions`);
      console.log(`⚠️  ${orphanedSessions} sessions reference non-existent users`);
    } else {
      console.log('✓ All sessions reference valid users');
    }
  } catch (error) {
    console.log(`⚠️  Could not verify session integrity: ${error.message}`);
  }

  // Check for duplicate emails
  try {
    const duplicates = await db.collection('users').aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (duplicates.length > 0) {
      issues.push(`Found ${duplicates.length} duplicate email addresses`);
      console.log(`⚠️  ${duplicates.length} duplicate email addresses found`);
      if (options.detailed) {
        duplicates.forEach(d => console.log(`     - ${d._id} (${d.count} times)`));
      }
    } else {
      console.log('✓ No duplicate email addresses');
    }
  } catch (error) {
    console.log(`⚠️  Could not check for duplicate emails: ${error.message}`);
  }

  console.log('');
  return issues;
}

async function verifySampleData() {
  console.log('=== Sample Data Verification ===\n');

  const db = mongoose.connection.db;

  // Get sample user
  try {
    const sampleUser = await db.collection('users').findOne({});
    if (sampleUser) {
      console.log('✓ Sample user found:');
      console.log(`  ID: ${sampleUser._id}`);
      console.log(`  Email: ${sampleUser.email}`);
      console.log(`  Created: ${sampleUser.createdAt || 'N/A'}`);
      
      // Check for related sessions
      const sessionCount = await db.collection('habitsessions').countDocuments({
        userId: sampleUser._id
      });
      console.log(`  Sessions: ${sessionCount}`);
    } else {
      console.log('⚠️  No users found in database');
    }
  } catch (error) {
    console.log(`⚠️  Could not verify sample data: ${error.message}`);
  }

  console.log('');
}

async function generateReport(results) {
  console.log('=== Verification Summary ===\n');

  const { collections, counts, indexes, issues } = results;

  console.log('Collections:');
  console.log(`  Total: ${collections.collections.length}`);
  console.log(`  Missing: ${collections.missing.length}`);
  console.log('');

  console.log('Documents:');
  Object.entries(counts).forEach(([name, count]) => {
    if (count >= 0) {
      console.log(`  ${name}: ${count.toLocaleString()}`);
    }
  });
  console.log('');

  console.log('Indexes:');
  Object.entries(indexes).forEach(([name, count]) => {
    if (count >= 0) {
      console.log(`  ${name}: ${count} indexes`);
    }
  });
  console.log('');

  if (issues.length > 0) {
    console.log('⚠️  Issues Found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('');
    console.log('Status: VERIFICATION FAILED - Issues detected');
    return false;
  } else {
    console.log('✓ Status: VERIFICATION PASSED - No issues detected');
    return true;
  }
}

async function main() {
  console.log('=== Database Restore Verification ===\n');

  await connectDatabase();

  const results = {
    collections: await verifyCollections(),
    counts: await verifyDocumentCounts(),
    indexes: await verifyIndexes(),
    issues: await verifyDataIntegrity(),
  };

  if (options.detailed) {
    await verifySampleData();
  }

  const passed = await generateReport(results);

  await mongoose.connection.close();
  console.log('\n✓ Database connection closed');

  process.exit(passed ? 0 : 1);
}

main().catch(error => {
  console.error('\nFatal error:', error.message);
  process.exit(1);
});
