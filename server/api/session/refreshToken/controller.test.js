/* eslint-env jest */
import request from 'supertest';
import { delay } from 'awaiting';
import server from '../../../server';
import config from '../../../../yeep.config';
import createUser from '../../user/create/service';
import deleteUser from '../../user/delete/service';
import { issueSessionToken } from '../issueToken/service';
import { AUTHENTICATION, EXCHANGE } from '../../../constants/tokenTypes';
import jwt from '../../../utils/jwt';

describe('api/session.refreshToken', () => {
  let ctx;
  let wile;

  beforeAll(async () => {
    await server.setup(config);
    ctx = server.getAppContext();

    wile = await createUser(ctx, {
      username: 'wile',
      password: 'catch-the-b1rd$',
      fullName: 'Wile E. Coyote',
      picture: 'https://www.acme.com/pictures/coyote.png',
      emails: [
        {
          address: 'coyote@acme.com',
          isVerified: true,
          isPrimary: true,
        },
      ],
    });
  });

  afterAll(async () => {
    await deleteUser(ctx, wile);
    await server.teardown();
  });

  test('refreshes session token', async () => {
    const { token } = await issueSessionToken(ctx, {
      username: 'wile',
      password: 'catch-the-b1rd$',
    });

    const payload = await jwt.verifyAsync(token, ctx.config.session.bearer.secret);
    await delay(1000); // wait at least for one second to pass

    const res = await request(server)
      .post('/api/session.refreshToken')
      .send({
        token,
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        ok: true,
        token: expect.any(String),
      })
    );

    const nextPayload = await jwt.verifyAsync(res.body.token, ctx.config.session.bearer.secret);
    expect(nextPayload.exp).toBeGreaterThan(payload.exp);
    expect(nextPayload.iat).toBeGreaterThan(payload.iat);

    const TokenModel = ctx.db.model('Token');
    expect(
      TokenModel.countDocuments({
        secret: payload.jti,
        type: AUTHENTICATION,
      })
    ).resolves.toBe(0);
    expect(
      TokenModel.countDocuments({
        secret: payload.jti,
        type: EXCHANGE,
      })
    ).resolves.toBe(1);
  });

  test('handles concurrent requests', async () => {
    const { token } = await issueSessionToken(ctx, {
      username: 'wile',
      password: 'catch-the-b1rd$',
    });

    await delay(1000); // wait at least for one second to pass

    const res1 = await request(server)
      .post('/api/session.refreshToken')
      .send({
        token,
      });

    expect(res1.status).toBe(200);
    expect(res1.body).toEqual(
      expect.objectContaining({
        ok: true,
        token: expect.any(String),
        expiresAt: expect.any(String),
      })
    );

    await delay(10);

    const res2 = await request(server)
      .post('/api/session.refreshToken')
      .send({
        token,
      });

    expect(res2.status).toBe(200);
    expect(res2.body).toEqual(
      expect.objectContaining({
        ok: true,
        token: expect.any(String),
        expiresAt: expect.any(String),
      })
    );

    expect(res1.body.token).toBe(res2.body.token);
    expect(res1.body.expiresAt).toBe(res2.body.expiresAt);
  });
});
