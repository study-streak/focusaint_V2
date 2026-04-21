# Environment Configuration Guide

This guide explains how to configure environment variables for the focusaint backend across different environments.

## Table of Contents

- [Overview](#overview)
- [Environment Files](#environment-files)
- [Required Variables](#required-variables)
- [Environment-Specific Setup](#environment-specific-setup)
- [Validation](#validation)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The focusaint backend uses environment variables for configuration. The application validates all required variables at startup and will refuse to start if any are missing or invalid.

### Supported Environments

- **development**: Local development with relaxed security
- **staging**: Pre-production testing environment
- **production**: Live production environment with strict security
- **test**: Automated testing environment

## Environment Files

### File Structure

```
backend/
├── .env                          # Active environment file (not in git)
├── .env.example                  # Template with all variables
├── .env.development.example      # Development-specific template
├── .env.staging.example          # Staging-specific template
└── .env.production.example       # Production-specific template
```

### Setup Instructions

1. **Choose your environment template**:
   ```bash
   # For development
   cp .env.development.example .env
   
   # For staging
   cp .env.staging.example .env
   
   # For production
   cp .env.production.example .env
   ```

2. **Fill in the values** in `.env` file

3. **Verify configuration**:
   ```bash
   npm run dev  # Server will validate on startup
   ```

## Required Variables

### Core Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Application environment | `development`, `staging`, `production` |
| `PORT` | No | Server port (default: 5000) | `5000` |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://localhost:27017/focusaint` |
| `REDIS_URL` | Yes | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) | Generate with `openssl rand -base64 32` |

### CORS Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `CORS_ORIGIN` | Yes | Comma-separated allowed origins | `http://localhost:3000` |
| `FRONTEND_URL` | Prod only | Primary frontend URL | `https://yourdomain.com` |

### Email Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `EMAIL_SERVICE` | No | Email provider (`gmail` or custom) | `gmail` |
| `EMAIL_USER` | Yes | Email address for sending | `noreply@yourdomain.com` |
| `EMAIL_PASSWORD` | Yes | Email password or app password | `your-app-password` |

### Custom SMTP (Optional)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SMTP_HOST` | No | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | No | SMTP server port | `587` |
| `SMTP_SECURE` | No | Use TLS (true/false) | `false` |

### External Services (Optional)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GEMINI_API_KEY` | No | Google Gemini API key for AI features | `your_api_key` |
| `STRIPE_SECRET_KEY` | No | Stripe API key for payments | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret | `whsec_...` |
| `SENTRY_DSN` | Prod only | Sentry error tracking DSN | `https://...@sentry.io/...` |

## Environment-Specific Setup

### Development Environment

**Purpose**: Local development with hot reload and debugging

**Configuration**:
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/focusaint
REDIS_URL=redis://localhost:6379
JWT_SECRET=focusaint_secret_key_change_in_production  # Default OK
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Features**:
- Relaxed security (HTTP allowed)
- Detailed logging
- Local databases
- Optional external services

**Setup Steps**:
1. Install MongoDB locally or use Docker
2. Install Redis locally or use Docker
3. Set up Gmail App Password for email testing
4. Copy `.env.development.example` to `.env`
5. Run `npm run dev`

### Staging Environment

**Purpose**: Pre-production testing that mirrors production

**Configuration**:
```bash
NODE_ENV=staging
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@staging-cluster.mongodb.net/focusaint
REDIS_URL=redis://user:pass@staging-redis:port
JWT_SECRET=<strong-unique-secret>  # Generate new secret
CORS_ORIGIN=https://staging.yourdomain.com
FRONTEND_URL=https://staging.yourdomain.com
EMAIL_SERVICE=gmail
EMAIL_USER=staging@yourdomain.com
EMAIL_PASSWORD=<app-password>
GEMINI_API_KEY=<your-key>
STRIPE_SECRET_KEY=sk_test_<test-key>  # Test mode
SENTRY_DSN=<your-dsn>
```

**Features**:
- Production-like security (HTTPS required)
- Cloud databases
- Test mode for payments
- Full error tracking

**Setup Steps**:
1. Create MongoDB Atlas staging cluster
2. Set up Redis Cloud staging instance
3. Generate strong JWT secret
4. Configure staging domain with SSL
5. Set up Stripe test mode
6. Configure Sentry for staging

### Production Environment

**Purpose**: Live production environment serving real users

**Configuration**:
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@prod-cluster.mongodb.net/focusaint
REDIS_URL=redis://user:pass@prod-redis:port
JWT_SECRET=<STRONG-UNIQUE-SECRET>  # MUST be unique!
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
FRONTEND_URL=https://yourdomain.com
EMAIL_SERVICE=gmail
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=<app-password>
GEMINI_API_KEY=<production-key>
STRIPE_SECRET_KEY=sk_live_<live-key>  # LIVE mode
STRIPE_WEBHOOK_SECRET=whsec_<webhook-secret>
SENTRY_DSN=<production-dsn>
```

**Critical Requirements**:
- ✅ JWT_SECRET must be unique (not default!)
- ✅ All databases must have backups enabled
- ✅ HTTPS must be enforced
- ✅ CORS_ORIGIN must include only trusted domains
- ✅ Stripe must be in LIVE mode
- ✅ Sentry must be configured
- ✅ All secrets must be stored securely

**Setup Steps**:
1. Create production MongoDB Atlas cluster with backups
2. Set up production Redis with persistence
3. Generate strong JWT secret: `openssl rand -base64 32`
4. Configure production domain with SSL certificate
5. Set up Stripe live mode and webhooks
6. Configure Sentry for production monitoring
7. Set up automated backups and monitoring
8. Test disaster recovery procedures

## Validation

### Automatic Validation

The application validates all environment variables on startup:

```javascript
// Validation happens automatically in server.js
import { validateEnvOrExit } from './utils/envValidation.js'
validateEnvOrExit()
```

### Validation Rules

- **Required fields**: Must be present
- **Type checking**: Numbers, booleans, strings
- **Pattern matching**: URLs, email addresses
- **Length validation**: Minimum character requirements
- **Enum validation**: Must match allowed values
- **Custom validation**: Environment-specific rules

### Validation Output

**Success**:
```
🔍 Validating environment variables...
✓ Environment validation passed
✓ Running in DEVELOPMENT mode
```

**Failure**:
```
🔍 Validating environment variables...

❌ Environment Validation Failed!

The following environment variables are missing or invalid:

   ✗ MONGODB_URI is required but not set. MongoDB connection string
   ✗ JWT_SECRET must be at least 32 characters long
   ✗ EMAIL_USER does not match required pattern. Email address for sending emails

Please check your .env file and ensure all required variables are set.
Refer to .env.example for the complete list of required variables.
```

## Security Best Practices

### 1. Never Commit Secrets

```bash
# .gitignore already includes:
.env
.env.local
.env.*.local
```

### 2. Use Strong Secrets

```bash
# Generate strong JWT secret
openssl rand -base64 32

# Generate strong password
openssl rand -base64 24
```

### 3. Rotate Secrets Regularly

- JWT secrets: Every 90 days
- API keys: When team members leave
- Database passwords: Every 180 days

### 4. Use Environment-Specific Secrets

- Never use the same secrets across environments
- Use different database credentials per environment
- Use Stripe test keys in non-production environments

### 5. Secure Secret Storage

**Development**:
- Store in `.env` file (not committed)
- Use password manager for team sharing

**Production**:
- Use environment variables in hosting platform
- Use secret management services (AWS Secrets Manager, HashiCorp Vault)
- Never store in code or version control

### 6. Principle of Least Privilege

- Database users should have minimum required permissions
- API keys should have minimum required scopes
- Service accounts should be environment-specific

## Troubleshooting

### Server Won't Start

**Problem**: Validation errors on startup

**Solution**:
1. Check console output for specific errors
2. Verify all required variables are set in `.env`
3. Check variable formats match requirements
4. Ensure `.env` file is in `backend/` directory

### Database Connection Fails

**Problem**: Cannot connect to MongoDB

**Solution**:
1. Verify `MONGODB_URI` format
2. Check database server is running
3. Verify network connectivity
4. Check credentials are correct
5. Ensure IP whitelist includes your server (Atlas)

### Redis Connection Fails

**Problem**: Cannot connect to Redis

**Solution**:
1. Verify `REDIS_URL` format
2. Check Redis server is running
3. Verify network connectivity
4. Check credentials are correct

### Email Not Sending

**Problem**: OTP emails not being delivered

**Solution**:
1. Verify `EMAIL_USER` and `EMAIL_PASSWORD`
2. For Gmail: Use App Password, not account password
3. Check email service is enabled
4. Verify SMTP settings for custom providers

### CORS Errors

**Problem**: Frontend cannot connect to API

**Solution**:
1. Verify `CORS_ORIGIN` includes frontend URL
2. Check protocol matches (http vs https)
3. Ensure no trailing slashes in URLs
4. Verify port numbers are correct

### JWT Errors

**Problem**: Authentication fails

**Solution**:
1. Verify `JWT_SECRET` is set
2. Check secret is at least 32 characters
3. Ensure secret hasn't changed (invalidates existing tokens)
4. Verify token expiration settings

## Getting Help

If you encounter issues not covered here:

1. Check the main README.md
2. Review error logs in console
3. Check Sentry for production errors
4. Contact the development team

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Google Gemini API](https://ai.google.dev/docs)
- [Sentry Documentation](https://docs.sentry.io/)
