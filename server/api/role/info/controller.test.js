/* eslint-env jest */
import request from 'supertest';
import server from '../../../server';
import config from '../../../../yeep.config';
import createPermission from '../../permission/create/service';
import deletePermission from '../../permission/delete/service';
import createUser from '../../user/create/service';
import createPermissionAssignment from '../../user/assignPermission/service';
import createOrg from '../../org/create/service';
import { createSession, signBearerJWT } from '../../session/issueToken/service';
import { destroySession } from '../../session/destroyToken/service';
import deletePermissionAssignment from '../../user/revokePermission/service';
import deleteOrg from '../../org/delete/service';
import deleteUser from '../../user/delete/service';
import createRole from '../create/service';
import deleteRole from '../delete/service';

describe('api/role.info', () => {
  let ctx;
  let user;
  let org;
  let permission;
  let permissionAssignment;
  let session;
  let bearerToken;

  beforeAll(async () => {
    await server.setup(config);
    ctx = server.getAppContext();

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

    org = await createOrg(ctx, {
      name: 'Acme Inc',
      slug: 'acme',
      adminId: user.id,
    });

    permission = await createPermission(ctx, {
      name: 'acme.test',
      description: 'you know, for testing',
      scope: org.id,
    });

    const PermissionModel = ctx.db.model('Permission');
    const requiredPermission = await PermissionModel.findOne({ name: 'yeep.role.read' });
    permissionAssignment = await createPermissionAssignment(ctx, {
      userId: user.id,
      orgId: org.id,
      permissionId: requiredPermission.id,
    });

    session = await createSession(ctx, {
      username: 'wile',
      password: 'catch-the-b1rd$',
    });
    bearerToken = await signBearerJWT(ctx, session);
  });

  afterAll(async () => {
    await destroySession(ctx, session);
    await deletePermissionAssignment(ctx, permissionAssignment);
    await deletePermission(ctx, permission);
    await deleteOrg(ctx, org);
    await deleteUser(ctx, user);
    await server.teardown();
  });

  test('returns error when role does not exist', async () => {
    const res = await request(server)
      .post('/api/role.info')
      .set('Authorization', `Bearer ${bearerToken}`)
      .send({
        id: '5b2d5dd0cd86b77258e16d39', // some random objectid
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: false,
      error: {
        code: 10017,
        message: 'Role 5b2d5dd0cd86b77258e16d39 not found',
      },
    });
  });

  describe('successful request', () => {
    let role;

    beforeAll(async () => {
      const globalPermission = await ctx.db
        .model('Permission')
        .findOne({ name: 'yeep.permission.read' });

      role = await createRole(ctx, {
        name: 'acme:manager',
        description: 'You know, for testing...',
        permissions: [permission.id, globalPermission.id],
        scope: org.id,
      });
    });

    afterAll(async () => {
      await deleteRole(ctx, role);
    });

    test('retrieves role info', async () => {
      const res = await request(server)
        .post('/api/role.info')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          id: role.id,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: true,
        role: {
          id: role.id,
          name: expect.any(String),
          description: expect.any(String),
          isSystemRole: expect.any(Boolean),
          org: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
          }),
          permissions: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
            }),
          ]),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });
  });

  describe('role is out of scope', () => {
    let role;

    beforeAll(async () => {
      const globalPermission = await ctx.db
        .model('Permission')
        .findOne({ name: 'yeep.permission.read' });

      role = await createRole(ctx, {
        // note the absence of scope to denote global role
        name: 'global:manager',
        description: 'You know, for testing...',
        permissions: [globalPermission.id],
      });
    });

    afterAll(async () => {
      await deleteRole(ctx, role);
    });

    test('returns error', async () => {
      const res = await request(server)
        .post('/api/role.info')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          id: role.id,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: 10012,
          message: `User ${user.id} does not have sufficient permissions to access this resource`,
        },
      });
    });
  });
});
