#!/usr/bin/env node

/**
 * Schedule monthly backup restoration tests
 * This script sets up automated monthly testing of backup recovery procedures
 * 
 * Usage: node backend/scripts/schedule-recovery-tests.js
 */

import cron from 'node-cron';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const RECOVERY_TEST_SCHEDULE = '0 2 1 * *'; // 2 AM on the 1st of every month
const LOG_DIR = './logs/recovery-tests';
const ALERT_EMAIL = process.env.ALERT_EMAIL || 'devops@focusaint.com';

class RecoveryTestScheduler {
  constructor() {
    this.setupLogging();
    this.setupEmailTransporter();
  }

  setupLogging() {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  }

  setupEmailTransporter() {
    if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    } else {
      console.warn('Email configuration not found. Email alerts will be disabled.');
      this.transporter = null;
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    console.log(logMessage.trim());
    
    // Append to log file
    const logFile = path.join(LOG_DIR, `scheduler-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logMessage);
  }

  async runRecoveryTest() {
    this.log('Starting scheduled recovery test...', 'info');
    
    const testStartTime = Date.now();
    const logFile = path.join(
      LOG_DIR,
      `recovery-test-${new Date().toISOString().replace(/:/g, '-')}.log`
    );

    return new Promise((resolve) => {
      const testProcess = spawn('node', ['backend/scripts/test-recovery.js']);
      
      const logStream = fs.createWriteStream(logFile);
      
      testProcess.stdout.pipe(logStream);
      testProcess.stderr.pipe(logStream);

      let output = '';
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      testProcess.on('close', (code) => {
        const duration = Date.now() - testStartTime;
        const success = code === 0;

        logStream.end();

        const result = {
          success,
          duration,
          exitCode: code,
          logFile,
          output,
          timestamp: new Date(),
        };

        if (success) {
          this.log(`Recovery test completed successfully in ${(duration / 1000).toFixed(2)}s`, 'info');
        } else {
          this.log(`Recovery test failed with exit code ${code}`, 'error');
        }

        resolve(result);
      });

      testProcess.on('error', (error) => {
        this.log(`Failed to start recovery test: ${error.message}`, 'error');
        logStream.end();
        resolve({
          success: false,
          duration: Date.now() - testStartTime,
          error: error.message,
          logFile,
          timestamp: new Date(),
        });
      });
    });
  }

  async sendAlert(result) {
    if (!this.transporter) {
      this.log('Email transporter not configured, skipping alert', 'warn');
      return;
    }

    const subject = result.success
      ? '✓ Monthly Recovery Test Passed'
      : '✗ Monthly Recovery Test FAILED';

    const html = `
      <h2>Monthly Backup Recovery Test Report</h2>
      <p><strong>Status:</strong> ${result.success ? '✓ PASSED' : '✗ FAILED'}</p>
      <p><strong>Timestamp:</strong> ${result.timestamp.toISOString()}</p>
      <p><strong>Duration:</strong> ${(result.duration / 1000).toFixed(2)}s</p>
      ${result.exitCode !== undefined ? `<p><strong>Exit Code:</strong> ${result.exitCode}</p>` : ''}
      ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
      <p><strong>Log File:</strong> ${result.logFile}</p>
      
      <h3>Action Required:</h3>
      ${result.success 
        ? '<p>No action required. Recovery procedures are working correctly.</p>'
        : '<p style="color: red;">⚠️ IMMEDIATE ACTION REQUIRED: Recovery test failed. Review logs and fix issues.</p>'
      }
      
      <h3>Next Steps:</h3>
      <ul>
        <li>Review the log file: ${result.logFile}</li>
        <li>Verify backup integrity</li>
        <li>Test recovery procedures manually if needed</li>
        <li>Update recovery documentation if procedures changed</li>
      </ul>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: ALERT_EMAIL,
        subject,
        html,
      });
      this.log('Alert email sent successfully', 'info');
    } catch (error) {
      this.log(`Failed to send alert email: ${error.message}`, 'error');
    }
  }

  async recordTestResult(result) {
    const resultsFile = path.join(LOG_DIR, 'test-results.json');
    
    let results = [];
    if (fs.existsSync(resultsFile)) {
      const data = fs.readFileSync(resultsFile, 'utf8');
      results = JSON.parse(data);
    }

    results.push({
      timestamp: result.timestamp,
      success: result.success,
      duration: result.duration,
      logFile: result.logFile,
    });

    // Keep only last 12 months of results
    if (results.length > 12) {
      results = results.slice(-12);
    }

    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    this.log('Test result recorded', 'info');
  }

  async executeScheduledTest() {
    this.log('=== Executing Monthly Recovery Test ===', 'info');
    
    try {
      const result = await this.runRecoveryTest();
      await this.recordTestResult(result);
      await this.sendAlert(result);
      
      this.log('=== Monthly Recovery Test Complete ===', 'info');
    } catch (error) {
      this.log(`Unexpected error during scheduled test: ${error.message}`, 'error');
    }
  }

  start() {
    this.log('Starting recovery test scheduler...', 'info');
    this.log(`Schedule: ${RECOVERY_TEST_SCHEDULE} (Monthly on 1st at 2 AM)`, 'info');
    this.log(`Alert email: ${ALERT_EMAIL}`, 'info');

    // Schedule the monthly test
    cron.schedule(RECOVERY_TEST_SCHEDULE, () => {
      this.executeScheduledTest();
    });

    this.log('Recovery test scheduler started successfully', 'info');
    this.log('Press Ctrl+C to stop', 'info');

    // Keep the process running
    process.on('SIGINT', () => {
      this.log('Shutting down recovery test scheduler...', 'info');
      process.exit(0);
    });
  }

  // Run test immediately (for testing the scheduler)
  async runNow() {
    this.log('Running recovery test immediately...', 'info');
    await this.executeScheduledTest();
    process.exit(0);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--now')) {
  // Run test immediately
  const scheduler = new RecoveryTestScheduler();
  scheduler.runNow();
} else if (args.includes('--help')) {
  console.log('Usage:');
  console.log('  node backend/scripts/schedule-recovery-tests.js          Start scheduler');
  console.log('  node backend/scripts/schedule-recovery-tests.js --now    Run test immediately');
  console.log('  node backend/scripts/schedule-recovery-tests.js --help   Show this help');
  console.log('');
  console.log('Environment Variables:');
  console.log('  ALERT_EMAIL         Email address for test alerts');
  console.log('  EMAIL_SERVICE       Email service (e.g., gmail)');
  console.log('  EMAIL_USER          Email username');
  console.log('  EMAIL_PASSWORD      Email password');
  process.exit(0);
} else {
  // Start the scheduler
  const scheduler = new RecoveryTestScheduler();
  scheduler.start();
}
