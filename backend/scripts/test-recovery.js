#!/usr/bin/env node

/**
 * Test database recovery process
 * This script simulates a recovery scenario to verify procedures work correctly
 * 
 * Usage: node backend/scripts/test-recovery.js
 */

import mongoose from 'mongoose';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/focusaint';
const TEST_DB = 'focusaint_recovery_test';
const TEST_BACKUP_DIR = './backups/test';
const RECOVERY_TIME_TARGET = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

class RecoveryTest {
  constructor() {
    this.results = {
      startTime: null,
      endTime: null,
      duration: null,
      steps: [],
      passed: false,
      errors: [],
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '✗' : type === 'success' ? '✓' : '→';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  recordStep(name, duration, success, details = {}) {
    this.results.steps.push({
      name,
      duration,
      success,
      details,
      timestamp: new Date(),
    });
  }

  async runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const proc = spawn(command, args);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        const duration = Date.now() - startTime;
        if (code === 0) {
          resolve({ success: true, duration, stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', (error) => {
        reject(error);
      });
    });
  }

  async setup() {
    this.log('Setting up test environment...', 'info');
    
    // Create test backup directory
    if (!fs.existsSync(TEST_BACKUP_DIR)) {
      fs.mkdirSync(TEST_BACKUP_DIR, { recursive: true });
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    this.log('Connected to MongoDB', 'success');
  }

  async createTestData() {
    this.log('Creating test data...', 'info');
    const startTime = Date.now();

    try {
      const db = mongoose.connection.db;
      const testDb = mongoose.connection.client.db(TEST_DB);

      // Create test collections with sample data
      const collections = {
        users: [
          { email: 'test1@example.com', name: 'Test User 1', createdAt: new Date() },
          { email: 'test2@example.com', name: 'Test User 2', createdAt: new Date() },
        ],
        habitsessions: [
          { userId: new mongoose.Types.ObjectId(), startTime: new Date(), status: 'completed' },
          { userId: new mongoose.Types.ObjectId(), startTime: new Date(), status: 'active' },
        ],
        habittasks: [
          { userId: new mongoose.Types.ObjectId(), title: 'Test Task', completed: false },
        ],
      };

      for (const [collectionName, docs] of Object.entries(collections)) {
        await testDb.collection(collectionName).insertMany(docs);
      }

      const duration = Date.now() - startTime;
      this.recordStep('Create test data', duration, true, {
        collections: Object.keys(collections).length,
        documents: Object.values(collections).reduce((sum, docs) => sum + docs.length, 0),
      });
      this.log(`Test data created in ${duration}ms`, 'success');
    } catch (error) {
      this.results.errors.push(`Failed to create test data: ${error.message}`);
      throw error;
    }
  }

  async createBackup() {
    this.log('Creating test backup...', 'info');
    const startTime = Date.now();

    try {
      const backupFile = path.join(TEST_BACKUP_DIR, `test-backup-${Date.now()}.archive`);
      
      const result = await this.runCommand('mongodump', [
        '--uri', MONGODB_URI.replace('/focusaint', `/${TEST_DB}`),
        '--archive=' + backupFile,
      ]);

      const duration = Date.now() - startTime;
      this.recordStep('Create backup', duration, true, {
        backupFile,
        size: fs.statSync(backupFile).size,
      });
      this.log(`Backup created in ${duration}ms`, 'success');
      
      return backupFile;
    } catch (error) {
      this.results.errors.push(`Failed to create backup: ${error.message}`);
      throw error;
    }
  }

  async dropTestDatabase() {
    this.log('Dropping test database (simulating data loss)...', 'info');
    const startTime = Date.now();

    try {
      const testDb = mongoose.connection.client.db(TEST_DB);
      await testDb.dropDatabase();

      const duration = Date.now() - startTime;
      this.recordStep('Drop database', duration, true);
      this.log(`Database dropped in ${duration}ms`, 'success');
    } catch (error) {
      this.results.errors.push(`Failed to drop database: ${error.message}`);
      throw error;
    }
  }

  async restoreBackup(backupFile) {
    this.log('Restoring from backup...', 'info');
    const startTime = Date.now();

    try {
      const result = await this.runCommand('mongorestore', [
        '--uri', MONGODB_URI.replace('/focusaint', `/${TEST_DB}`),
        '--archive=' + backupFile,
        '--drop',
      ]);

      const duration = Date.now() - startTime;
      this.recordStep('Restore backup', duration, true, {
        backupFile,
      });
      this.log(`Backup restored in ${duration}ms`, 'success');
    } catch (error) {
      this.results.errors.push(`Failed to restore backup: ${error.message}`);
      throw error;
    }
  }

  async verifyRestore() {
    this.log('Verifying restored data...', 'info');
    const startTime = Date.now();

    try {
      const testDb = mongoose.connection.client.db(TEST_DB);
      
      const collections = await testDb.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);

      const expectedCollections = ['users', 'habitsessions', 'habittasks'];
      const missingCollections = expectedCollections.filter(
        name => !collectionNames.includes(name)
      );

      if (missingCollections.length > 0) {
        throw new Error(`Missing collections: ${missingCollections.join(', ')}`);
      }

      // Verify document counts
      const userCount = await testDb.collection('users').countDocuments();
      const sessionCount = await testDb.collection('habitsessions').countDocuments();
      const taskCount = await testDb.collection('habittasks').countDocuments();

      if (userCount !== 2 || sessionCount !== 2 || taskCount !== 1) {
        throw new Error(
          `Document count mismatch: users=${userCount}, sessions=${sessionCount}, tasks=${taskCount}`
        );
      }

      // Verify data integrity
      const sampleUser = await testDb.collection('users').findOne({ email: 'test1@example.com' });
      if (!sampleUser) {
        throw new Error('Sample user not found after restore');
      }

      const duration = Date.now() - startTime;
      this.recordStep('Verify restore', duration, true, {
        collections: collectionNames.length,
        users: userCount,
        sessions: sessionCount,
        tasks: taskCount,
      });
      this.log(`Verification completed in ${duration}ms`, 'success');
    } catch (error) {
      this.results.errors.push(`Verification failed: ${error.message}`);
      throw error;
    }
  }

  async cleanup() {
    this.log('Cleaning up test environment...', 'info');

    try {
      // Drop test database
      const testDb = mongoose.connection.client.db(TEST_DB);
      await testDb.dropDatabase();

      // Remove test backups
      if (fs.existsSync(TEST_BACKUP_DIR)) {
        const files = fs.readdirSync(TEST_BACKUP_DIR);
        files.forEach(file => {
          fs.unlinkSync(path.join(TEST_BACKUP_DIR, file));
        });
        fs.rmdirSync(TEST_BACKUP_DIR);
      }

      this.log('Cleanup completed', 'success');
    } catch (error) {
      this.log(`Cleanup warning: ${error.message}`, 'error');
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('RECOVERY TEST REPORT');
    console.log('='.repeat(80) + '\n');

    const totalDuration = this.results.duration;
    const targetMet = totalDuration < RECOVERY_TIME_TARGET;

    console.log('Overall Results:');
    console.log(`  Status: ${this.results.passed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`  Target: ${RECOVERY_TIME_TARGET / 1000}s (${RECOVERY_TIME_TARGET / 3600000}h)`);
    console.log(`  Target Met: ${targetMet ? '✓ YES' : '✗ NO'}`);
    console.log('');

    console.log('Step Breakdown:');
    this.results.steps.forEach((step, index) => {
      const status = step.success ? '✓' : '✗';
      const duration = (step.duration / 1000).toFixed(2);
      console.log(`  ${index + 1}. ${status} ${step.name}: ${duration}s`);
      if (Object.keys(step.details).length > 0) {
        Object.entries(step.details).forEach(([key, value]) => {
          console.log(`     - ${key}: ${value}`);
        });
      }
    });
    console.log('');

    if (this.results.errors.length > 0) {
      console.log('Errors:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      console.log('');
    }

    console.log('Recommendations:');
    if (!targetMet) {
      console.log('  ⚠️  Recovery time exceeds 4-hour target');
      console.log('  → Consider optimizing backup/restore process');
      console.log('  → Review database size and indexing strategy');
    } else {
      console.log('  ✓ Recovery time within acceptable limits');
    }
    console.log('');

    console.log('='.repeat(80) + '\n');
  }

  async run() {
    this.results.startTime = Date.now();

    try {
      await this.setup();
      await this.createTestData();
      const backupFile = await this.createBackup();
      await this.dropTestDatabase();
      await this.restoreBackup(backupFile);
      await this.verifyRestore();

      this.results.passed = true;
      this.log('Recovery test completed successfully', 'success');
    } catch (error) {
      this.results.passed = false;
      this.log(`Recovery test failed: ${error.message}`, 'error');
    } finally {
      this.results.endTime = Date.now();
      this.results.duration = this.results.endTime - this.results.startTime;

      await this.cleanup();
      await mongoose.connection.close();

      this.generateReport();

      process.exit(this.results.passed ? 0 : 1);
    }
  }
}

// Run the test
const test = new RecoveryTest();
test.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
