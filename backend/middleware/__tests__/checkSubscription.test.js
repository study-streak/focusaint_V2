import { requirePremium } from '../checkSubscription.js';
import Subscription from '../../models/Subscription.js';

// Mock the Subscription model
jest.mock('../../models/Subscription.js');

describe('requirePremium middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {
        userId: 'user123',
        email: 'test@example.com'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should allow access for users with active subscription', async () => {
    const mockSubscription = {
      userId: 'user123',
      status: 'active',
      plan: 'premium_monthly'
    };

    Subscription.findOne.mockResolvedValue(mockSubscription);

    await requirePremium(req, res, next);

    expect(Subscription.findOne).toHaveBeenCalledWith({ userId: 'user123' });
    expect(req.subscription).toEqual(mockSubscription);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should allow access for users with trialing subscription', async () => {
    const mockSubscription = {
      userId: 'user123',
      status: 'trialing',
      plan: 'premium_yearly'
    };

    Subscription.findOne.mockResolvedValue(mockSubscription);

    await requirePremium(req, res, next);

    expect(req.subscription).toEqual(mockSubscription);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should deny access when no subscription exists', async () => {
    Subscription.findOne.mockResolvedValue(null);

    await requirePremium(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Premium subscription required',
      tier: 'free',
      upgradeUrl: '/pricing'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should deny access for expired subscription', async () => {
    const mockSubscription = {
      userId: 'user123',
      status: 'expired',
      plan: 'premium_monthly'
    };

    Subscription.findOne.mockResolvedValue(mockSubscription);

    await requirePremium(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Premium subscription required',
      tier: 'free',
      upgradeUrl: '/pricing'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should deny access for canceled subscription', async () => {
    const mockSubscription = {
      userId: 'user123',
      status: 'canceled',
      plan: 'premium_monthly'
    };

    Subscription.findOne.mockResolvedValue(mockSubscription);

    await requirePremium(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Premium subscription required',
      tier: 'free',
      upgradeUrl: '/pricing'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should deny access for past_due subscription', async () => {
    const mockSubscription = {
      userId: 'user123',
      status: 'past_due',
      plan: 'premium_monthly'
    };

    Subscription.findOne.mockResolvedValue(mockSubscription);

    await requirePremium(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Premium subscription required',
      tier: 'free',
      upgradeUrl: '/pricing'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when user is not authenticated', async () => {
    req.user = null;

    await requirePremium(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required'
    });
    expect(next).not.toHaveBeenCalled();
    expect(Subscription.findOne).not.toHaveBeenCalled();
  });

  it('should return 401 when userId is missing', async () => {
    req.user = { email: 'test@example.com' };

    await requirePremium(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    const dbError = new Error('Database connection failed');
    Subscription.findOne.mockRejectedValue(dbError);

    // Spy on console.error to verify error logging
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await requirePremium(req, res, next);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error checking subscription status:', dbError);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to verify subscription status'
    });
    expect(next).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
