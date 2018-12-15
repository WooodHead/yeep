/* eslint-env jest */
import request from 'supertest';
import server from '../../../server';
import config from '../../../../yeep.config';
import deleteUser from '../../user/delete/service';
import createUser from '../../user/create/service';
import deletePermissionAssignment from '../../user/revokePermission/service';
import destroySessionToken from '../../session/destroy/service';
import createSessionToken from '../../session/create/service';
import createPermissionAssignment from '../../user/assignPermission/service';
import createOrg from '../create/service';
import deleteOrg from '../delete/service';

describe('api/v1/org.addMember', () => {
  let ctx;

  beforeAll(async () => {
    await server.setup(config);
    ctx = server.getAppContext();
  });

  afterAll(async () => {
    await server.teardown();
  });

  describe('unauthorized user', () => {
    test('returns error pretending resource does not exist', async () => {
      const res = await request(server)
        .post('/api/v1/org.addMember')
        .send();
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 404,
          message: 'Resource does not exist',
        },
      });
    });
  });

  describe('authorized user', () => {
    let org;
    let wile;
    let runner;
    let permissionAssignment;
    let session;

    beforeAll(async () => {
      wile = await createUser(ctx.db, {
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

      org = await createOrg(ctx.db, {
        name: 'Acme Inc',
        slug: 'acme',
        adminId: wile.id,
      });

      runner = await createUser(ctx.db, {
        username: 'runner',
        password: 'fast+furry-ous',
        fullName: 'Road Runner',
        picture: 'https://www.acme.com/pictures/roadrunner.png',
        emails: [
          {
            address: 'beep-beep@acme.com',
            isVerified: true,
            isPrimary: true,
          },
        ],
      });

      const PermissionModel = ctx.db.model('Permission');
      const permission = await PermissionModel.findOne({
        name: 'yeep.user.write',
      });
      permissionAssignment = await createPermissionAssignment(ctx.db, {
        userId: wile.id,
        orgId: null, // global scope
        permissionId: permission.id,
      });

      session = await createSessionToken(ctx.db, ctx.jwt, {
        username: 'wile',
        password: 'catch-the-b1rd$',
      });
    });

    afterAll(async () => {
      await destroySessionToken(ctx.db, session);
      await deletePermissionAssignment(ctx.db, permissionAssignment);
      await deleteUser(ctx.db, wile);
      await deleteUser(ctx.db, runner);
      await deleteOrg(ctx.db, org);
    });

    test('returns error when `orgId` is unknown', async () => {
      const res = await request(server)
        .post('/api/v1/org.addMember')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          orgId: '507f1f77bcf86cd799439012', // i.e. some random ID
          userId: runner.id,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 10011,
          message: 'Org "507f1f77bcf86cd799439012" does not exist',
        },
      });
    });

    test('returns error when `userId` is unknown', async () => {
      const res = await request(server)
        .post('/api/v1/org.addMember')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          orgId: org.id,
          userId: '507f1f77bcf86cd799439012', // i.e. some random ID
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 10001,
          message: 'User "507f1f77bcf86cd799439012" does not exist',
        },
      });
    });

    test('returns error when user is already a member of org', async () => {
      const res = await request(server)
        .post('/api/v1/org.addMember')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          orgId: org.id,
          userId: wile.id,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 10028,
        },
      });
    });

    test('returns error when `permissions` array contains unknown permission id', async () => {
      const res = await request(server)
        .post('/api/v1/org.addMember')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          orgId: org.id,
          userId: runner.id,
          permissions: [
            {
              id: '507f1f77bcf86cd799439012', // some random ID
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 10008,
          message: 'Permission "507f1f77bcf86cd799439012" does not exist',
        },
      });
    });

    test('returns error when a supplied permission does not match org scope', async () => {
      const PermissionModel = ctx.db.model('Permission');
      const permission = await PermissionModel.findOne({
        name: 'yeep.user.write',
      });

      const res = await request(server)
        .post('/api/v1/org.addMember')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          orgId: org.id,
          userId: runner.id,
          permissions: [
            {
              id: permission._id.toHexString(),
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 10011,
          message: `Permission "${permission._id.toHexString()}" cannot be assigned to the designated org`,
        },
      });
    });

    test('returns error when `roles` array contains unknown roleId', async () => {
      const res = await request(server)
        .post('/api/v1/org.addMember')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          userId: runner.id,
          orgId: org.id,
          roles: [
            {
              id: '507f1f77bcf86cd799439012', // some random ID
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 10017,
          message: 'Role "507f1f77bcf86cd799439012" does not exist',
        },
      });
    });

    test('returns error when a supplied role does not match org scope', async () => {
      const RoleModel = ctx.db.model('Role');
      const role = await RoleModel.findOne({
        name: 'admin',
      });

      const res = await request(server)
        .post('/api/v1/org.addMember')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          userId: runner.id,
          orgId: org.id,
          roles: [
            {
              id: role._id.toHexString(),
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 10019,
          message: `Role "${role._id.toHexString()}" cannot be assigned to the designated org`,
        },
      });
    });

    test('creates new org membership', async () => {
      const res = await request(server)
        .post('/api/v1/org.addMember')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          userId: runner.id,
          orgId: org.id,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: true,
      });
    });
  });
});