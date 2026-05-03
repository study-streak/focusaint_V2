import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Dodo Payments integration (optional)
  dodoPaymentId: {
    type: String,
    default: null
  },
  dodoSubscriptionId: {
    type: String,
    default: null
  },
  
  // Plan details
  plan: {
    type: String,
    enum: ['premium_monthly', 'premium_yearly', 'pro_monthly', 'pro_yearly'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'expired', 'trialing'],
    default: 'active'
  },
  
  // Billing periods
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  canceledAt: {
    type: Date
  },
  
  // Trial
  trialStart: {
    type: Date
  },
  trialEnd: {
    type: Date
  },
  
  // Payment history
  lastPaymentDate: {
    type: Date
  },
  lastPaymentAmount: {
    type: Number
  },
  failedPaymentAttempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
