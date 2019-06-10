/* eslint-env jest */
import request from 'supertest';
import server from '../../../server';
import config from '../../../../yeep.config';
import createPermission from '../create/service';
import deletePermission from '../delete/service';
import createUser from '../../user/create/service';
import createPermissionAssignment from '../../user/assignPermission/service';
import createOrg from '../../org/create/service';
import { issueSessionToken } from '../../session/issueToken/service';
import { destroySessionToken } from '../../session/destroyToken/service';
import deletePermissionAssignment from '../../user/revokePermission/service';
import deleteOrg from '../../org/delete/service';
import deleteUser from '../../user/delete/service';

describe('api/permission.info', () => {
  let ctx;
  let user;
  let org;
  let permissionAssignment;
  let session;

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

    const PermissionModel = ctx.db.model('Permission');
    const permission = await PermissionModel.findOne({ name: 'yeep.permission.read' });
    permissionAssignment = await createPermissionAssignment(ctx, {
      userId: user.id,
      orgId: org.id,
      permissionId: permission.id,
    });

    session = await issueSessionToken(ctx, {
      username: 'wile',
      password: 'catch-the-b1rd$',
    });
  });

  afterAll(async () => {
    await destroySessionToken(ctx, session);
    await deletePermissionAssignment(ctx, permissionAssignment);
    await deleteOrg(ctx, org);
    await deleteUser(ctx, user);
    await server.teardown();
  });

  test('returns error when permission does not exist', async () => {
    const res = await request(server)
      .post('/api/permission.info')
      .set('Authorization', `Bearer ${session.token}`)
      .send({
        id: '5b2d5dd0cd86b77258e16d39', // some random objectid
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: false,
      error: {
        code: 10008,
        message: 'Permission 5b2d5dd0cd86b77258e16d39 cannot be found',
      },
    });
  });

  test('retrieves permission info', async () => {
    const permission = await createPermission(ctx, {
      name: 'acme.test',
      description: 'This is a test',
      scope: org.id,
    });

    const res = await request(server)
      .post('/api/permission.info')
      .set('Authorization', `Bearer ${session.token}`)
      .send({
        id: permission.id,
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      permission: {
        id: permission.id,
      },
    });

    const isPermissionDeleted = await deletePermission(ctx, permission);
    expect(isPermissionDeleted).toBe(true);
  });

  test('returns error when permission is out of scope', async () => {
    const permission = await createPermission(ctx, {
      // note the absence of scope to denote global permission
      name: 'acme.test',
      description: 'This is a test',
    });

    const res = await request(server)
      .post('/api/permission.info')
      .set('Authorization', `Bearer ${session.token}`)
      .send({
        id: permission.id,
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: false,
      error: {
        code: 10012,
        message: `User ${user.id} does not have sufficient permissions to access this resource`,
      },
    });

    const isPermissionDeleted = await deletePermission(ctx, permission);
    expect(isPermissionDeleted).toBe(true);
  });
});
