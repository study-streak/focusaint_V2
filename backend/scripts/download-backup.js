#!/usr/bin/env node

/**
 * Download backup from S3 storage
 * Usage: 
 *   node backend/scripts/download-backup.js --latest
 *   node backend/scripts/download-backup.js --date 2024-01-15
 *   node backend/scripts/download-backup.js --name focusaint-2024-01-15.archive
 */

import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const BACKUP_BUCKET = process.env.BACKUP_S3_BUCKET || 'focusaint-backups';
const BACKUP_PREFIX = process.env.BACKUP_PREFIX || 'mongodb/';
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || './backups';

const args = process.argv.slice(2);

function parseArgs() {
  const options = {
    latest: args.includes('--latest'),
    date: null,
    name: null,
  };

  const dateIndex = args.indexOf('--date');
  if (dateIndex !== -1 && args[dateIndex + 1]) {
    options.date = args[dateIndex + 1];
  }

  const nameIndex = args.indexOf('--name');
  if (nameIndex !== -1 && args[nameIndex + 1]) {
    options.name = args[nameIndex + 1];
  }

  return options;
}

async function listS3Backups() {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  const command = new ListObjectsV2Command({
    Bucket: BACKUP_BUCKET,
    Prefix: BACKUP_PREFIX,
  });

  const response = await s3Client.send(command);

  if (!response.Contents || response.Contents.length === 0) {
    throw new Error('No backups found in S3');
  }

  return response.Contents
    .filter(obj => obj.Key.endsWith('.archive') || obj.Key.endsWith('.gz'))
    .map(obj => ({
      key: obj.Key,
      name: path.basename(obj.Key),
      size: obj.Size,
      date: obj.LastModified,
    }))
    .sort((a, b) => b.date - a.date);
}

async function downloadFromS3(key, destination) {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  console.log(`Downloading ${key} from S3...`);

  const command = new GetObjectCommand({
    Bucket: BACKUP_BUCKET,
    Key: key,
  });

  const response = await s3Client.send(command);

  // Ensure download directory exists
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  const writeStream = fs.createWriteStream(destination);
  
  await pipeline(response.Body, writeStream);

  console.log(`✓ Downloaded to ${destination}`);
  
  const stats = fs.statSync(destination);
  console.log(`  Size: ${formatBytes(stats.size)}`);
  
  return destination;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function main() {
  const options = parseArgs();

  if (!options.latest && !options.date && !options.name) {
    console.error('Error: Must specify --latest, --date, or --name');
    console.log('\nUsage:');
    console.log('  node backend/scripts/download-backup.js --latest');
    console.log('  node backend/scripts/download-backup.js --date 2024-01-15');
    console.log('  node backend/scripts/download-backup.js --name focusaint-2024-01-15.archive');
    process.exit(1);
  }

  console.log('Fetching backup list from S3...\n');
  const backups = await listS3Backups();

  let selectedBackup;

  if (options.latest) {
    selectedBackup = backups[0];
    console.log(`Selected latest backup: ${selectedBackup.name}`);
  } else if (options.date) {
    selectedBackup = backups.find(b => b.name.includes(options.date));
    if (!selectedBackup) {
      console.error(`Error: No backup found for date ${options.date}`);
      console.log('\nAvailable backups:');
      backups.slice(0, 10).forEach(b => console.log(`  - ${b.name}`));
      process.exit(1);
    }
    console.log(`Selected backup: ${selectedBackup.name}`);
  } else if (options.name) {
    selectedBackup = backups.find(b => b.name === options.name);
    if (!selectedBackup) {
      console.error(`Error: Backup ${options.name} not found`);
      console.log('\nAvailable backups:');
      backups.slice(0, 10).forEach(b => console.log(`  - ${b.name}`));
      process.exit(1);
    }
    console.log(`Selected backup: ${selectedBackup.name}`);
  }

  console.log(`  Size: ${formatBytes(selectedBackup.size)}`);
  console.log(`  Date: ${selectedBackup.date.toISOString()}\n`);

  const destination = path.join(DOWNLOAD_DIR, selectedBackup.name);

  // Check if file already exists
  if (fs.existsSync(destination)) {
    console.log(`Warning: ${destination} already exists`);
    console.log('Overwriting...\n');
  }

  const startTime = Date.now();
  await downloadFromS3(selectedBackup.key, destination);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n✓ Download completed in ${duration}s`);
  console.log(`\nBackup ready for restore: ${destination}`);
}

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
