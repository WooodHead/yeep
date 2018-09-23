/* eslint-env jest */
import request from 'supertest';
import server from '../../../server';
import createUser from '../../user/create/service';
import createOrg from '../../org/create/service';
import createSessionToken from '../../session/create/service';
import destroySessionToken from '../../session/destroy/service';
import deleteOrg from '../../org/delete/service';
import deleteUser from '../../user/delete/service';
// import createPermission from '../../permission/create/service';
// import createRole from '../create/service';
// import deleteRole from '../delete/service';
// import deletePermission from '../../permission/delete/service';

describe('api/v1/user.list', () => {
  let ctx;

  beforeAll(async () => {
    await server.setup();
    ctx = server.getAppContext();
  });

  afterAll(async () => {
    await server.teardown();
  });

  describe('unauthorized user', () => {
    test('returns error pretending resource does not exist', async () => {
      const res = await request(server)
        .post('/api/v1/user.list')
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
    let wile;
    let porky;
    let wazowski;
    let spongebob;
    let acme;
    let monsters;
    let session;

    beforeAll(async () => {
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

      // create test users
      porky = await createUser(ctx.db, {
        username: 'porky',
        password: "Th-th-th-that's all folks!",
        fullName: 'Porky Pig',
        picture: 'https://www.acme.com/pictures/porky.png',
        emails: [
          {
            address: 'porky@acme.com',
            isVerified: true,
            isPrimary: true,
          },
        ],
        orgs: [acme.id],
      });
      wazowski = await createUser(ctx.db, {
        username: 'wazowski',
        password: 'grrrrrrrrrrr',
        fullName: 'Mike Wazowski',
        picture: 'https://www.monstersinc.com/pictures/wazowski.png',
        emails: [
          {
            address: 'wazowski@monstersinc.com',
            isVerified: true,
            isPrimary: true,
          },
        ],
        orgs: [monsters.id],
      });
      spongebob = await createUser(ctx.db, {
        username: 'spongebob',
        password: 'weeeeedddd',
        fullName: 'SpongeBob SquarePants',
        picture: 'https://www.squarepants.com/spongebob.jpg',
        emails: [
          {
            address: 'spongebob@squarepants.com',
            isVerified: true,
            isPrimary: true,
          },
        ],
        // note the absense of an org
      });

      // user "wile" is logged-in
      session = await createSessionToken(ctx.db, ctx.jwt, {
        username: 'wile',
        password: 'catch-the-b1rd$',
      });
    });

    afterAll(async () => {
      await destroySessionToken(ctx.db, session);
      await deleteUser(ctx.db, wile);
      await deleteUser(ctx.db, porky);
      await deleteUser(ctx.db, wazowski);
      await deleteUser(ctx.db, spongebob);
      await deleteOrg(ctx.db, acme);
      await deleteOrg(ctx.db, monsters);
    });

    test('returns list of users the requestor has access to', async () => {
      const res = await request(server)
        .post('/api/v1/user.list')
        .set('Authorization', `Bearer ${session.token}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: true,
        users: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            username: expect.any(String),
            fullName: expect.any(String),
            picture: expect.any(String),
            emails: [
              {
                address: expect.any(String),
                isVerified: true,
                isPrimary: true,
              },
            ],
            orgs: expect.arrayContaining([expect.any(String)]),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          }),
        ]),
      });
      expect(res.body.users.length).toBe(3);
      expect(res.body.users.findIndex((user) => user.username === 'wazowski')).not.toBe(-1);
      expect(res.body.users.findIndex((user) => user.username === 'wile')).not.toBe(-1);
      expect(res.body.users.findIndex((user) => user.username === 'porky')).not.toBe(-1);
      expect(res.body.users.findIndex((user) => user.username === 'squarepants')).toBe(-1);
    });

    test('limits number of users using `limit` param', async () => {
      const res = await request(server)
        .post('/api/v1/user.list')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          limit: 1,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: true,
        users: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            username: expect.any(String),
            fullName: expect.any(String),
            picture: expect.any(String),
            emails: [
              {
                address: expect.any(String),
                isVerified: true,
                isPrimary: true,
              },
            ],
            orgs: expect.arrayContaining([expect.any(String)]),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          }),
        ]),
        nextCursor: expect.any(String),
      });
      expect(res.body.users.length).toBe(1);
    });

    test('paginates through users using `cursor` param', async () => {
      const res = await request(server)
        .post('/api/v1/user.list')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          limit: 2,
        });
      expect(res.body).toMatchObject({
        ok: true,
      });
      expect(res.body.users.length).toBe(2);

      const res1 = await request(server)
        .post('/api/v1/user.list')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          limit: 1,
        });
      expect(res1.body).toMatchObject({
        ok: true,
        nextCursor: expect.any(String),
      });
      expect(res1.body.users.length).toBe(1);
      expect(res1.body.users[0]).toEqual(res.body.users[0]);

      const res2 = await request(server)
        .post('/api/v1/user.list')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          limit: 1,
          cursor: res1.body.nextCursor,
        });
      expect(res2.body).toMatchObject({
        ok: true,
      });
      expect(res2.body.users.length).toBe(1);
      expect(res2.body.users[0]).toEqual(res.body.users[1]);
    });

    test('filters users using `q` param', async () => {
      const res = await request(server)
        .post('/api/v1/user.list')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          q: 'por',
        });
      expect(res.body).toMatchObject({
        ok: true,
        users: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            username: 'porky',
            fullName: expect.any(String),
            picture: expect.any(String),
            emails: [
              {
                address: expect.any(String),
                isVerified: true,
                isPrimary: true,
              },
            ],
            orgs: expect.arrayContaining([expect.any(String)]),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          }),
        ]),
      });
      expect(res.body.users.length).toBe(1);
    });

    test('projects user props using `projection` param', async () => {
      const res = await request(server)
        .post('/api/v1/user.list')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          projection: {
            emails: false,
            updatedAt: false,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: true,
        users: expect.arrayContaining([
          expect.not.objectContaining({
            emails: [
              {
                address: expect.any(String),
                isVerified: true,
                isPrimary: true,
              },
            ],
            updatedAt: expect.any(String),
          }),
        ]),
      });
    });

    describe('without permission', () => {
      let otherSession;

      beforeAll(async () => {
        // user "spongebob" is logged-in
        otherSession = await createSessionToken(ctx.db, ctx.jwt, {
          username: 'spongebob',
          password: 'weeeeedddd',
        });
      });

      afterAll(async () => {
        await destroySessionToken(ctx.db, otherSession);
      });

      test('returns empty list of users', async () => {
        const res = await request(server)
          .post('/api/v1/user.list')
          .set('Authorization', `Bearer ${otherSession.token}`)
          .send();

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
          ok: true,
          users: [],
        });
      });
    });
  });
});