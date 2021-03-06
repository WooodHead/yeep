/* eslint-env jest */
import request from 'supertest';
import server from '../../../server';
import config from '../../../../yeep.config';
import createUser from '../../user/create/service';
import createOrg from '../../org/create/service';
import addMemberToOrg from '../../org/addMember/service';
import listPermissions from '../../permission/list/service';
import assignPermission from '../../user/assignPermission/service';
import { createSession, signBearerJWT } from '../../session/issueToken/service';
import { destroySession } from '../../session/destroyToken/service';
import deleteOrg from '../../org/delete/service';
import deleteUser from '../../user/delete/service';

describe('api/org.list', () => {
  let ctx;
  let wile;
  let oswell;
  let professor;
  let runner;
  let acme;
  let monsters;
  let umbrella;
  let session;
  let professorSession;
  let bearerToken;
  let professorBearerToken;

  beforeAll(async () => {
    await server.setup(config);
    ctx = server.getAppContext();

    // user "wile" is admin in acme + monsters org
    [wile, oswell, professor] = await Promise.all([
      createUser(ctx, {
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
      }),
      createUser(ctx, {
        username: 'oswell',
        password: 'our-business-$s-l1f3-1ts3lf',
        fullName: 'Oswell E. Spencer',
        picture: 'https://www.umbrella.com/pictures/spencer.png',
        emails: [
          {
            address: 'oswellspencer@umbrella.com',
            isVerified: true,
            isPrimary: true,
          },
        ],
      }),
      createUser(ctx, {
        username: 'tyrant',
        password: 't-103MrX',
        fullName: 'Shinji Mikami',
        picture: 'https://www.umbrella.com/pictures/mrx.png',
        emails: [
          {
            address: 'misterx@umbrella.com',
            isVerified: true,
            isPrimary: true,
          },
        ],
      }),
    ]);

    [acme, monsters, umbrella] = await Promise.all([
      createOrg(ctx, {
        name: 'Acme Inc',
        slug: 'acme',
        adminId: wile.id,
      }),
      createOrg(ctx, {
        name: 'Monsters Inc',
        slug: 'monsters',
        adminId: wile.id,
      }),
      createOrg(ctx, {
        name: 'Umbrella Corp',
        slug: 'umbrella',
      }),
    ]);

    // we need the org id to make requests about this user
    runner = await createUser(ctx, {
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
      orgs: [acme.id],
    });

    // user "wile" is logged-in
    session = await createSession(ctx, {
      username: 'wile',
      password: 'catch-the-b1rd$',
    });
    bearerToken = await signBearerJWT(ctx, session);

    const { permissions: userReadPermissions } = await listPermissions(ctx, {
      q: 'yeep.user.read',
      scopes: [null],
      limit: 1,
    });

    // user professor is logged-in
    professorSession = await createSession(ctx, {
      username: 'tyrant',
      password: 't-103MrX',
    });
    professorBearerToken = await signBearerJWT(ctx, professorSession);

    // we add professor to acme organisation
    await addMemberToOrg(ctx, {
      orgId: acme.id,
      userId: professor.id,
    });

    // and we give him the global yeep.user.read permission
    await assignPermission(ctx, {
      userId: professor.id,
      orgId: acme.id,
      permissionId: userReadPermissions[0].id,
    });
  });

  afterAll(async () => {
    await destroySession(ctx, session);
    await destroySession(ctx, professorSession);
    await deleteUser(ctx, wile);
    await deleteUser(ctx, oswell);
    await deleteUser(ctx, runner);
    await deleteUser(ctx, professor);
    await deleteOrg(ctx, acme);
    await deleteOrg(ctx, monsters);
    await deleteOrg(ctx, umbrella);
    await server.teardown();
  });

  test('returns list of orgs the user has access to', async () => {
    const res = await request(server)
      .post('/api/org.list')
      .set('Authorization', `Bearer ${bearerToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.orgs.length).toBe(2);
    expect(res.body).toMatchObject({
      ok: true,
      orgs: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          slug: expect.any(String),
          usersCount: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      ]),
    });
    expect(res.body.orgs.length).toBe(2);
  });

  test('limits number of orgs using `limit` param', async () => {
    const res = await request(server)
      .post('/api/org.list')
      .set('Authorization', `Bearer ${bearerToken}`)
      .send({
        limit: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      orgs: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          slug: expect.any(String),
          usersCount: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      ]),
      nextCursor: expect.any(String),
    });
    expect(res.body.orgs.length).toBe(1);
  });

  test('paginates through orgs using `cursor` param', async () => {
    const res = await request(server)
      .post('/api/org.list')
      .set('Authorization', `Bearer ${bearerToken}`)
      .send({
        limit: 2,
      });
    expect(res.body).toMatchObject({
      ok: true,
    });
    expect(res.body.orgs.length).toBe(2);

    const res1 = await request(server)
      .post('/api/org.list')
      .set('Authorization', `Bearer ${bearerToken}`)
      .send({
        limit: 1,
      });
    expect(res1.body).toMatchObject({
      ok: true,
      nextCursor: expect.any(String),
    });
    expect(res1.body.orgs.length).toBe(1);
    expect(res1.body.orgs[0]).toEqual(res.body.orgs[0]);

    const res2 = await request(server)
      .post('/api/org.list')
      .set('Authorization', `Bearer ${bearerToken}`)
      .send({
        limit: 1,
        cursor: res1.body.nextCursor,
      });
    expect(res2.body).toMatchObject({
      ok: true,
    });
    expect(res2.body.orgs.length).toBe(1);
    expect(res2.body.orgs[0]).toEqual(res.body.orgs[1]);
  });

  test('filters orgs using `q` param', async () => {
    const res = await request(server)
      .post('/api/org.list')
      .set('Authorization', `Bearer ${bearerToken}`)
      .send({
        q: 'acme',
      });
    expect(res.body).toMatchObject({
      ok: true,
      orgs: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          slug: expect.any(String),
          usersCount: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      ]),
    });
  });

  test('filters orgs using `user` param', async () => {
    const res = await request(server)
      .post('/api/org.list')
      .set('Authorization', `Bearer ${bearerToken}`)
      .send({
        user: runner.id,
      });
    expect(res.body).toMatchObject({
      ok: true,
      orgs: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          slug: expect.any(String),
          usersCount: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      ]),
      orgsCount: 1,
    });
  });

  test('returns 0 orgs when filtering by user with no access', async () => {
    const res = await request(server)
      .post('/api/org.list')
      .set('Authorization', `Bearer ${bearerToken}`)
      .send({
        user: oswell.id,
      });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      orgs: [],
      orgsCount: 0,
    });
  });

  test('throws AuthorizationError when requesting organisations of a user with yeep.user.read access but not assignment access', async () => {
    const res = await request(server)
      .post('/api/org.list')
      .set('Authorization', `Bearer ${professorBearerToken}`)
      .send({
        user: runner.id,
      });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: false,
      error: {
        // authorisation code
        code: 10012,
        message: expect.any(String),
      },
    });
  });
});
