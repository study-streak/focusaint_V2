import { describe, it, expect, beforeEach, vi } from 'vitest';
import { csrfTokenGenerator, csrfProtection, getCsrfToken } from '../csrf.js';

describe('CSRF Protection Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'POST',
      cookies: {},
      headers: {}
    };
    res = {
      cookie: vi.fn(),
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
    next = vi.fn();
  });

  describe('csrfTokenGenerator', () => {
    it('should generate and set CSRF token if not present', () => {
      csrfTokenGenerator(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'csrf-token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          sameSite: 'strict'
        })
      );
      expect(next).toHaveBeenCalled();
    });

    it('should skip token generation if token already exists', () => {
      req.cookies['csrf-token'] = 'existing-token';

      csrfTokenGenerator(req, res, next);

      expect(res.cookie).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('csrfProtection', () => {
    it('should allow safe methods without CSRF token', () => {
      req.method = 'GET';

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject POST request without cookie token', () => {
      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'CSRF_TOKEN_MISSING'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject POST request without header token', () => {
      req.cookies['csrf-token'] = 'test-token';

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'CSRF_TOKEN_MISSING'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject POST request with mismatched tokens', () => {
      req.cookies['csrf-token'] = 'token-in-cookie';
      req.headers['x-csrf-token'] = 'different-token';

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'CSRF_TOKEN_INVALID'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow POST request with matching tokens', () => {
      const token = 'matching-token';
      req.cookies['csrf-token'] = token;
      req.headers['x-csrf-token'] = token;

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('getCsrfToken', () => {
    it('should return existing token from cookie', () => {
      req.cookies['csrf-token'] = 'existing-token';

      getCsrfToken(req, res);

      expect(res.json).toHaveBeenCalledWith({
        csrfToken: 'existing-token'
      });
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('should generate new token if not present', () => {
      getCsrfToken(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'csrf-token',
        expect.any(String),
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith({
        csrfToken: expect.any(String)
      });
    });
  });
});
