/* eslint-env jest */
import request from 'supertest';
import config from '../../../../yeep.config';
import server from '../../../server';
import deleteOrg from '../delete/service';
import createOrg from './service';
import createUser from '../../user/create/service';
import { createSession, signBearerJWT } from '../../session/issueToken/service';
import { destroySession } from '../../session/destroyToken/service';
import deleteUser from '../../user/delete/service';
import getUserInfo from '../../user/info/service';
import createPermissionAssignment from '../../user/assignPermission/service';
import deletePermissionAssignment from '../../user/revokePermission/service';

describe('api/org.create', () => {
  let ctx;

  beforeAll(async () => {
    await server.setup(config);
    ctx = server.getAppContext();
  });

  afterAll(async () => {
    await server.teardown();
  });

  describe('unauthorized user', () => {
    test('throws authentication error', async () => {
      const res = await request(server)
        .post('/api/org.create')
        .send({
          id: '507f191e810c19729de860ea', // some random object id
        });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 10000,
          message: 'Access denied; invalid or missing credentials',
        },
      });
    });
  });

  describe('authorized user', () => {
    let wile;
    let session;
    let bearerToken;

    beforeAll(async () => {
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

      session = await createSession(ctx, {
        username: 'wile',
        password: 'catch-the-b1rd$',
      });
      bearerToken = await signBearerJWT(ctx, session);
    });

    afterAll(async () => {
      await destroySession(ctx, session);
      await deleteUser(ctx, wile);
    });

    test('returns error when `slug` contains invalid characters', async () => {
      const res = await request(server)
        .post('/api/org.create')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'ACME Inc.',
          slug: '@cme',
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 400,
          message: 'Invalid request body',
          details: expect.any(Array),
        },
      });
      expect(res.body.error.details[0].path).toEqual(['slug']);
      expect(res.body.error.details[0].type).toBe('string.regex.name');
    });

    test('returns error when `slug` contains more than 30 characters', async () => {
      const res = await request(server)
        .post('/api/org.create')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'ACME Inc.',
          slug: '0123456789012345678901234567890',
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 400,
          message: 'Invalid request body',
          details: expect.any(Array),
        },
      });
      expect(res.body.error.details[0].path).toEqual(['slug']);
      expect(res.body.error.details[0].type).toBe('string.max');
    });

    test('returns error when `slug` contains less than 2 characters', async () => {
      const res = await request(server)
        .post('/api/org.create')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'ACME Inc.',
          slug: 'a',
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 400,
          message: 'Invalid request body',
          details: expect.any(Array),
        },
      });
      expect(res.body.error.details[0].path).toEqual(['slug']);
      expect(res.body.error.details[0].type).toBe('string.min');
    });

    test('returns error when `name` is unspecified', async () => {
      const res = await request(server)
        .post('/api/org.create')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 400,
          message: 'Invalid request body',
          details: expect.any(Array),
        },
      });
      expect(res.body.error.details[0].path).toEqual(['name']);
      expect(res.body.error.details[0].type).toBe('any.required');
    });

    test('returns error when `slug` is unspecified', async () => {
      const res = await request(server)
        .post('/api/org.create')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ name: 'ACME Inc.' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 400,
          message: 'Invalid request body',
          details: expect.any(Array),
        },
      });
      expect(res.body.error.details[0].path).toEqual(['slug']);
      expect(res.body.error.details[0].type).toBe('any.required');
    });

    test('returns error when payload contains unknown properties', async () => {
      const res = await request(server)
        .post('/api/org.create')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'ACME Inc.',
          slug: 'acme',
          foo: 'bar',
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 400,
          message: 'Invalid request body',
          details: expect.any(Array),
        },
      });
      expect(res.body.error.details[0].path).toEqual(['foo']);
      expect(res.body.error.details[0].type).toBe('object.allowUnknown');
    });

    test('creates new org and returns expected response', async () => {
      const res = await request(server)
        .post('/api/org.create')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'ACME Inc.',
          slug: 'acme',
        });

      expect(res.status).toBe(200);
      expect(res.type).toMatch(/json/);
      expect(res.body).toMatchObject({
        ok: true,
        org: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          slug: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      });

      const admin = await getUserInfo(ctx, wile);
      expect(admin.orgs).toEqual(expect.arrayContaining([res.body.org.id]));

      const isOrgDeleted = await deleteOrg(ctx, res.body.org);
      expect(isOrgDeleted).toBe(true);
    });

    test('returns error on duplicate org slug', async () => {
      const org = await createOrg(ctx, {
        name: 'ACME Inc.',
        slug: 'acme',
        adminId: wile.id,
      });

      const res = await request(server)
        .post('/api/org.create')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'ACME S.A.',
          slug: 'acme',
        });
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 10003,
          message: expect.any(String),
        },
      });

      const isOrgDeleted = await deleteOrg(ctx, org);
      expect(isOrgDeleted).toBe(true);
    });
  });

  describe('when isOrgCreationOpen = false', () => {
    let user;
    let session;
    let bearerToken;

    beforeAll(async () => {
      ctx.config.isOrgCreationOpen = false;

      user = await createUser(ctx, {
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

      session = await createSession(ctx, {
        username: 'wile',
        password: 'catch-the-b1rd$',
      });
      bearerToken = await signBearerJWT(ctx, session);
    });

    afterAll(async () => {
      ctx.config.isOrgCreationOpen = true;
      await destroySession(ctx, session);
      await deleteUser(ctx, user);
    });

    describe('user does not have required permission', () => {
      test('returns authorization error', async () => {
        const res = await request(server)
          .post('/api/org.create')
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            name: 'ACME Inc.',
            slug: 'acme',
          });

        expect(res.status).toBe(200);
        expect(res.type).toMatch(/json/);
        expect(res.body).toMatchObject({
          ok: false,
          error: {
            code: 10012,
            message: `User ${user.id} is not authorized to create orgs`,
          },
        });
      });
    });

    describe('user has required permission', () => {
      let permissionAssignment;

      beforeAll(async () => {
        const PermissionModel = ctx.db.model('Permission');
        const permission = await PermissionModel.findOne({ name: 'yeep.org.write' });
        permissionAssignment = await createPermissionAssignment(ctx, {
          userId: user.id,
          permissionId: permission.id,
          // global org
        });
      });

      afterAll(async () => {
        await deletePermissionAssignment(ctx, permissionAssignment);
      });

      test('creates new org and returns expected response', async () => {
        const res = await request(server)
          .post('/api/org.create')
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            name: 'ACME Inc.',
            slug: 'acme',
          });

        expect(res.status).toBe(200);
        expect(res.type).toMatch(/json/);
        expect(res.body).toMatchObject({
          ok: true,
          org: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            slug: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          }),
        });

        const isOrgDeleted = await deleteOrg(ctx, res.body.org);
        expect(isOrgDeleted).toBe(true);
      });
    });
  });
});
