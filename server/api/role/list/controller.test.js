/* eslint-env jest */
import request from 'supertest';
import server from '../../../server';
import config from '../../../../yeep.config';
import createUser from '../../user/create/service';
import createOrg from '../../org/create/service';
import createSession from '../../session/create/service';
import destroySession from '../../session/destroy/service';
import deleteOrg from '../../org/delete/service';
import deleteUser from '../../user/delete/service';
import createPermission from '../../permission/create/service';
import createRole from '../create/service';
import assignRole from '../../user/assignRole/service';
import deleteRole from '../delete/service';
import deletePermission from '../../permission/delete/service';

describe('api/v1/role.list', () => {
  let ctx;
  let wile;
  let acme;
  let monsters;
  let permission;
  let roles;
  let globalRole;
  let session;

  beforeAll(async () => {
    await server.setup(config);
    ctx = server.getAppContext();

    // user "wile" is admin in acme + monsters org
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
    [acme, monsters] = await Promise.all([
      createOrg(ctx.db, {
        name: 'Acme Inc',
        slug: 'acme',
        adminId: wile.id,
      }),
      createOrg(ctx.db, {
        name: 'Monsters Inc',
        slug: 'monsters',
        adminId: wile.id,
      }),
    ]);

    // create test permission + role(s)
    permission = await createPermission(ctx.db, {
      name: 'acme.code.write',
      description: 'Permission to edit (write, delete, update) source code',
    });

    roles = await Promise.all([
      createRole(ctx.db, {
        name: 'acme:developer',
        description: 'Developer role',
        permissions: [permission.id],
        scope: acme.id,
      }),
      createRole(ctx.db, {
        name: 'monsters:developer',
        description: 'Developer role',
        permissions: [permission.id],
        scope: monsters.id,
      }),
    ]);

    globalRole = await createRole(ctx.db, {
      name: 'global:role',
      description: 'Global test role',
      permissions: [permission.id],
    });

    await assignRole(ctx.db, {
      userId: wile.id,
      roleId: globalRole.id,
    });

    // user "wile" is logged-in
    session = await createSession(ctx, {
      username: 'wile',
      password: 'catch-the-b1rd$',
    });
  });

  afterAll(async () => {
    await destroySession(ctx, session);
    await Promise.all(roles.map((role) => deleteRole(ctx.db, role)));
    await deleteRole(ctx.db, globalRole);
    await deletePermission(ctx.db, permission);
    await deleteUser(ctx.db, wile);
    await deleteOrg(ctx.db, acme);
    await deleteOrg(ctx.db, monsters);
    await server.teardown();
  });

  test('returns list of roles the user has access to', async () => {
    const res = await request(server)
      .post('/api/v1/role.list')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send();

    expect(res.status).toBe(200);
    // NOTE: Even though the user is assigned 3 roles, one of them is global.
    //       If the user has no access to the global org domain then they wont 
    //       be able to read its roles. Imagine a user having only write priviledges
    //       but not read. This would be weird but still valid. Changing the behaviour
    //       of this would mean adding more complex checks that are currently not needed.
    expect(res.body.roles.length).toBe(2);
    expect(res.body).toMatchObject({
      ok: true,
      roles: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          isSystemRole: expect.any(Boolean),
          usersCount: expect.any(Number),
          permissions: expect.arrayContaining([expect.any(String)]),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          org: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
          }),
        }),
      ]),
    });
  });

  test('limits number of roles using `limit` param', async () => {
    const res = await request(server)
      .post('/api/v1/role.list')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({
        limit: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      roles: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          isSystemRole: expect.any(Boolean),
          usersCount: expect.any(Number),
          permissions: expect.arrayContaining([expect.any(String)]),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          org: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
          }),
        }),
      ]),
      nextCursor: expect.any(String),
    });
    expect(res.body.roles.length).toBe(1);
  });

  test('paginates through roles using `cursor` param', async () => {
    const res = await request(server)
      .post('/api/v1/role.list')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({
        limit: 2,
      });
    expect(res.body).toMatchObject({
      ok: true,
    });
    expect(res.body.roles.length).toBe(2);

    const res1 = await request(server)
      .post('/api/v1/role.list')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({
        limit: 1,
      });
    expect(res1.body).toMatchObject({
      ok: true,
      nextCursor: expect.any(String),
    });
    expect(res1.body.roles.length).toBe(1);
    expect(res1.body.roles[0]).toEqual(res.body.roles[0]);

    const res2 = await request(server)
      .post('/api/v1/role.list')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({
        limit: 1,
        cursor: res1.body.nextCursor,
      });
    expect(res2.body).toMatchObject({
      ok: true,
    });
    expect(res2.body.roles.length).toBe(1);
    expect(res2.body.roles[0]).toEqual(res.body.roles[1]);
  });

  test('filters roles using `q` param', async () => {
    const res = await request(server)
      .post('/api/v1/role.list')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({
        q: 'acme',
      });
    expect(res.body).toMatchObject({
      ok: true,
      roles: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          isSystemRole: expect.any(Boolean),
          usersCount: expect.any(Number),
          permissions: expect.arrayContaining([expect.any(String)]),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      ]),
    });
  });
});
