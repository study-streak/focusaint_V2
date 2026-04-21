#!/usr/bin/env node

/**
 * List available database backups
 * Usage: node backend/scripts/list-backups.js [--detailed]
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const BACKUP_BUCKET = process.env.BACKUP_S3_BUCKET || 'focusaint-backups';
const BACKUP_PREFIX = process.env.BACKUP_PREFIX || 'mongodb/';
const LOCAL_BACKUP_DIR = process.env.LOCAL_BACKUP_DIR || './backups';

const args = process.argv.slice(2);
const detailed = args.includes('--detailed');

async function listS3Backups() {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  try {
    const command = new ListObjectsV2Command({
      Bucket: BACKUP_BUCKET,
      Prefix: BACKUP_PREFIX,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      console.log('No backups found in S3');
      return [];
    }

    const backups = response.Contents
      .filter(obj => obj.Key.endsWith('.archive') || obj.Key.endsWith('.gz'))
      .map(obj => ({
        name: path.basename(obj.Key),
        path: obj.Key,
        size: formatBytes(obj.Size),
        sizeBytes: obj.Size,
        date: obj.LastModified,
        location: 's3',
      }))
      .sort((a, b) => b.date - a.date);

    return backups;
  } catch (error) {
    console.error('Error listing S3 backups:', error.message);
    return [];
  }
}

function listLocalBackups() {
  if (!fs.existsSync(LOCAL_BACKUP_DIR)) {
    console.log('Local backup directory does not exist');
    return [];
  }

  const files = fs.readdirSync(LOCAL_BACKUP_DIR);
  const backups = files
    .filter(file => file.endsWith('.archive') || file.endsWith('.gz'))
    .map(file => {
      const filePath = path.join(LOCAL_BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: formatBytes(stats.size),
        sizeBytes: stats.size,
        date: stats.mtime,
        location: 'local',
      };
    })
    .sort((a, b) => b.date - a.date);

  return backups;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

function displayBackups(backups) {
  if (backups.length === 0) {
    console.log('No backups found');
    return;
  }

  console.log('\n=== Available Backups ===\n');

  if (detailed) {
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.name}`);
      console.log(`   Location: ${backup.location}`);
      console.log(`   Path: ${backup.path}`);
      console.log(`   Size: ${backup.size}`);
      console.log(`   Date: ${formatDate(backup.date)}`);
      console.log(`   Age: ${getAge(backup.date)}`);
      console.log('');
    });
  } else {
    console.log('Name'.padEnd(40) + 'Size'.padEnd(12) + 'Date'.padEnd(22) + 'Location');
    console.log('-'.repeat(80));
    backups.forEach(backup => {
      console.log(
        backup.name.padEnd(40) +
        backup.size.padEnd(12) +
        formatDate(backup.date).padEnd(22) +
        backup.location
      );
    });
  }

  console.log(`\nTotal backups: ${backups.length}`);
  console.log(`Latest backup: ${backups[0].name} (${getAge(backups[0].date)} ago)`);
}

function getAge(date) {
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}

async function main() {
  console.log('Scanning for backups...\n');

  const [s3Backups, localBackups] = await Promise.all([
    listS3Backups(),
    Promise.resolve(listLocalBackups()),
  ]);

  const allBackups = [...s3Backups, ...localBackups];

  displayBackups(allBackups);

  // Export for programmatic use
  if (process.env.JSON_OUTPUT) {
    console.log('\n' + JSON.stringify(allBackups, null, 2));
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
