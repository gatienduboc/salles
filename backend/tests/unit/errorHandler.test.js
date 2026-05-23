import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../../src/middleware/errorHandler.js';

function mockRes() {
  const res = { statusCode: 0, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

describe('errorHandler', () => {
  it('masque les erreurs SQL', () => {
    const err = new Error("update `users` set `city_latitude` = 1 - Unknown column 'city_latitude'");
    err.code = 'ER_BAD_FIELD_ERROR';
    const res = mockRes();
    errorHandler(err, {}, res, vi.fn());
    expect(res.body.error).not.toMatch(/update `users`/i);
    expect(res.body.error).toMatch(/Enregistrement impossible/);
  });

  it('expose les erreurs 4xx métier', () => {
    const err = new Error('Email déjà utilisé');
    err.status = 409;
    const res = mockRes();
    errorHandler(err, {}, res, vi.fn());
    expect(res.body.error).toBe('Email déjà utilisé');
  });
});
