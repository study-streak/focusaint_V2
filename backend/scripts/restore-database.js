#!/usr/bin/env node

/**
 * Restore MongoDB database from backup
 * Usage:
 *   node backend/scripts/restore-database.js --backup ./backups/focusaint-2024-01-15.archive
 *   node backend/scripts/restore-database.js --backup ./backups/backup.archive --collection users
 *   node backend/scripts/restore-database.js --backup ./backups/backup.archive --drop-existing
 *   node backend/scripts/restore-database.js --backup ./backups/backup.archive --target-db focusaint_temp
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/focusaint';
const DEFAULT_DB = 'focusaint';

const args = process.argv.slice(2);

function parseArgs() {
  const options = {
    backup: null,
    collection: null,
    dropExisting: args.includes('--drop-existing') || args.includes('--drop'),
    targetDb: null,
    dryRun: args.includes('--dry-run'),
    noIndexRestore: args.includes('--no-index-restore'),
  };

  const backupIndex = args.indexOf('--backup');
  if (backupIndex !== -1 && args[backupIndex + 1]) {
    options.backup = args[backupIndex + 1];
  }

  const collectionIndex = args.indexOf('--collection');
  if (collectionIndex !== -1 && args[collectionIndex + 1]) {
    options.collection = args[collectionIndex + 1];
  }

  const targetDbIndex = args.indexOf('--target-db');
  if (targetDbIndex !== -1 && args[targetDbIndex + 1]) {
    options.targetDb = args[targetDbIndex + 1];
  }

  return options;
}

function validateBackupFile(backupPath) {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  const stats = fs.statSync(backupPath);
  if (stats.size === 0) {
    throw new Error('Backup file is empty');
  }

  console.log(`✓ Backup file validated: ${backupPath}`);
  console.log(`  Size: ${formatBytes(stats.size)}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function confirmRestore(options) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log('\n⚠️  WARNING: This will restore data from backup');
    if (options.dropExisting) {
      console.log('⚠️  WARNING: --drop-existing will DELETE all existing data first!');
    }
    console.log('\nRestore details:');
    console.log(`  Backup: ${options.backup}`);
    console.log(`  Target DB: ${options.targetDb || DEFAULT_DB}`);
    console.log(`  Collection: ${options.collection || 'ALL'}`);
    console.log(`  Drop existing: ${options.dropExisting ? 'YES' : 'NO'}`);
    console.log('');

    rl.question('Type "RESTORE" to confirm: ', (answer) => {
      rl.close();
      resolve(answer.trim() === 'RESTORE');
    });
  });
}

async function runRestore(options) {
  const mongorestore = 'mongorestore';
  const args = [];

  // Connection string
  args.push('--uri', MONGODB_URI);

  // Archive file
  args.push('--archive=' + options.backup);

  // Target database
  if (options.targetDb) {
    args.push('--nsFrom', `${DEFAULT_DB}.*`);
    args.push('--nsTo', `${options.targetDb}.*`);
  }

  // Specific collection
  if (options.collection) {
    args.push('--nsInclude', `${DEFAULT_DB}.${options.collection}`);
  }

  // Drop existing data
  if (options.dropExisting) {
    args.push('--drop');
  }

  // No index restore (faster, rebuild later)
  if (options.noIndexRestore) {
    args.push('--noIndexRestore');
  }

  // Verbose output
  args.push('--verbose');

  console.log('\nExecuting mongorestore...');
  console.log(`Command: ${mongorestore} ${args.join(' ')}\n`);

  if (options.dryRun) {
    console.log('DRY RUN - No actual restore performed');
    return;
  }

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const process = spawn(mongorestore, args);

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(output);
    });

    process.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.error(output);
    });

    process.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (code === 0) {
        console.log(`\n✓ Restore completed successfully in ${duration}s`);
        resolve({ success: true, duration, stdout, stderr });
      } else {
        console.error(`\n✗ Restore failed with exit code ${code}`);
        reject(new Error(`mongorestore failed with exit code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(new Error(`Failed to start mongorestore: ${error.message}`));
    });
  });
}

async function main() {
  const options = parseArgs();

  if (!options.backup) {
    console.error('Error: --backup parameter is required');
    console.log('\nUsage:');
    console.log('  node backend/scripts/restore-database.js --backup ./backups/backup.archive');
    console.log('  node backend/scripts/restore-database.js --backup ./backups/backup.archive --collection users');
    console.log('  node backend/scripts/restore-database.js --backup ./backups/backup.archive --drop-existing');
    console.log('  node backend/scripts/restore-database.js --backup ./backups/backup.archive --target-db focusaint_temp');
    console.log('\nOptions:');
    console.log('  --backup <path>        Path to backup archive file (required)');
    console.log('  --collection <name>    Restore only specific collection');
    console.log('  --drop-existing        Drop existing data before restore');
    console.log('  --target-db <name>     Restore to different database');
    console.log('  --no-index-restore     Skip index restoration (faster)');
    console.log('  --dry-run              Show what would be done without executing');
    process.exit(1);
  }

  console.log('=== MongoDB Database Restore ===\n');

  // Validate backup file
  validateBackupFile(options.backup);

  // Confirm restore (skip for dry run)
  if (!options.dryRun) {
    const confirmed = await confirmRestore(options);
    if (!confirmed) {
      console.log('\nRestore cancelled by user');
      process.exit(0);
    }
  }

  // Run restore
  await runRestore(options);

  console.log('\n=== Next Steps ===');
  console.log('1. Run verification: node backend/scripts/verify-restore.js');
  console.log('2. Check application logs');
  console.log('3. Test critical functionality');
  if (options.noIndexRestore) {
    console.log('4. Rebuild indexes: node backend/scripts/rebuild-indexes.js');
  }
}

main().catch(error => {
  console.error('\nFatal error:', error.message);
  process.exit(1);
});
