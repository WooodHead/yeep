/* eslint-env jest */
import request from 'supertest';
import server from '../../../server';
import deleteUser from '../delete/service';
import createUser from '../create/service';
import createPermission from '../../permission/create/service';
import deletePermission from '../../permission/delete/service';
import createOrg from '../../org/create/service';
import deleteOrg from '../../org/delete/service';

describe('api/v1/user.assignPermission', () => {
  let ctx;

  beforeAll(async () => {
    await server.setup();
    ctx = server.getAppContext();
  });

  afterAll(async () => {
    await server.teardown();
  });

  test('returns error when `userId` contains invalid characters', async () => {
    const res = await request(server)
      .post('/api/v1/user.assignPermission')
      .send({
        userId: '507f1f77bcf86cd79943901@',
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
    expect(res.body.error.details[0].path).toEqual(['userId']);
    expect(res.body.error.details[0].type).toBe('string.hex');
  });

  test('returns error when `userId` contains more than 24 characters', async () => {
    const res = await request(server)
      .post('/api/v1/user.assignPermission')
      .send({
        userId: '507f1f77bcf86cd7994390112',
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
    expect(res.body.error.details[0].path).toEqual(['userId']);
    expect(res.body.error.details[0].type).toBe('string.length');
  });

  test('returns error when `userId` contains less than 24 characters', async () => {
    const res = await request(server)
      .post('/api/v1/user.assignPermission')
      .send({
        userId: '507f1f77bcf86cd79943901',
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
    expect(res.body.error.details[0].path).toEqual(['userId']);
    expect(res.body.error.details[0].type).toBe('string.length');
  });

  test('returns error when `userId` is unspecified', async () => {
    const res = await request(server)
      .post('/api/v1/user.assignPermission')
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
    expect(res.body.error.details[0].path).toEqual(['userId']);
    expect(res.body.error.details[0].type).toBe('any.required');
  });

  test('returns error when `orgId` contains invalid characters', async () => {
    const res = await request(server)
      .post('/api/v1/user.assignPermission')
      .send({
        userId: '507f1f77bcf86cd799439011',
        orgId: '507f1f77bcf86cd79943901@',
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
    expect(res.body.error.details[0].path).toEqual(['orgId']);
    expect(res.body.error.details[0].type).toBe('string.hex');
  });

  test('returns error when `orgId` contains more than 24 characters', async () => {
    const res = await request(server)
      .post('/api/v1/user.assignPermission')
      .send({
        userId: '507f1f77bcf86cd799439011',
        orgId: '507f1f77bcf86cd7994390112',
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
    expect(res.body.error.details[0].path).toEqual(['orgId']);
    expect(res.body.error.details[0].type).toBe('string.length');
  });

  test('returns error when `orgId` contains less than 24 characters', async () => {
    const res = await request(server)
      .post('/api/v1/user.assignPermission')
      .send({
        userId: '507f1f77bcf86cd799439011',
        orgId: '507f1f77bcf86cd79943901',
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
    expect(res.body.error.details[0].path).toEqual(['orgId']);
    expect(res.body.error.details[0].type).toBe('string.length');
  });

  test('returns error when `permissionId` contains invalid characters', async () => {
    const res = await request(server)
      .post('/api/v1/user.assignPermission')
      .send({
        userId: '507f1f77bcf86cd799439011',
        orgId: '507f1f77bcf86cd799439012',
        permissionId: '507f1f77bcf86cd79943901@',
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
    expect(res.body.error.details[0].path).toEqual(['permissionId']);
    expect(res.body.error.details[0].type).toBe('string.hex');
  });

  test('returns error when `permissionId` contains more than 24 characters', async () => {
    const res = await request(server)
      .post('/api/v1/user.assignPermission')
      .send({
        userId: '507f1f77bcf86cd799439011',
        orgId: '507f1f77bcf86cd799439012',
        permissionId: '507f1f77bcf86cd7994390112',
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
    expect(res.body.error.details[0].path).toEqual(['permissionId']);
    expect(res.body.error.details[0].type).toBe('string.length');
  });

  test('returns error when `permissionId` contains less than 24 characters', async () => {
    const res = await request(server)
      .post('/api/v1/user.assignPermission')
      .send({
        userId: '507f1f77bcf86cd799439011',
        orgId: '507f1f77bcf86cd799439012',
        permissionId: '507f1f77bcf86cd79943901',
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
    expect(res.body.error.details[0].path).toEqual(['permissionId']);
    expect(res.body.error.details[0].type).toBe('string.length');
  });

  test('returns error when `permissionId` is unspecified', async () => {
    const res = await request(server)
      .post('/api/v1/user.assignPermission')
      .send({
        userId: '507f1f77bcf86cd799439011',
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
    expect(res.body.error.details[0].path).toEqual(['permissionId']);
    expect(res.body.error.details[0].type).toBe('any.required');
  });

  test('returns error when payload contains unknown properties', async () => {
    const res = await request(server)
      .post('/api/v1/user.assignPermission')
      .send({
        userId: '507f1f77bcf86cd799439011',
        permissionId: '507f1f77bcf86cd799439013',
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

  test('returns error when user does not exist', async () => {
    const res = await request(server)
      .post('/api/v1/user.assignPermission')
      .send({
        userId: '507f1f77bcf86cd799439011',
        permissionId: '507f1f77bcf86cd799439013',
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: false,
      error: {
        code: 10001,
        message: 'User does not exist',
      },
    });
  });

  test('returns error when permission does not exist', async () => {
    const user = await createUser(ctx.db, {
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

    const res = await request(server)
      .post('/api/v1/user.assignPermission')
      .send({
        userId: user.id,
        permissionId: '507f1f77bcf86cd799439013',
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: false,
      error: {
        code: 10008,
        message: 'Permission does not exist',
      },
    });

    const isUserDeleted = await deleteUser(ctx.db, user);
    expect(isUserDeleted).toBe(true);
  });

  test('returns error when permission scope does not include the designated org', async () => {
    const user = await createUser(ctx.db, {
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

    const org = await createOrg(ctx.db, {
      name: 'Acme Inc',
      slug: 'acme',
    });

    const otherOrg = await createOrg(ctx.db, {
      name: 'Speak Riddles Old Man Ltd',
      slug: 'speakriddles',
    });

    const permission = await createPermission(ctx.db, {
      name: 'yeep.permission.test',
      description: 'Test permission',
      scope: [org.id],
    });

    const res = await request(server)
      .post('/api/v1/user.assignPermission')
      .send({
        userId: user.id,
        permissionId: permission.id,
        orgId: otherOrg.id,
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: false,
      error: {
        code: 10011,
        message: 'Permission cannot be assigned to the designated org',
      },
    });

    const isUserDeleted = await deleteUser(ctx.db, user);
    expect(isUserDeleted).toBe(true);

    const isPermissionDeleted = await deletePermission(ctx.db, permission);
    expect(isPermissionDeleted).toBe(true);

    const isOrgDeleted = await deleteOrg(ctx.db, org);
    expect(isOrgDeleted).toBe(true);

    const isOtherOrgDeleted = await deleteOrg(ctx.db, otherOrg);
    expect(isOtherOrgDeleted).toBe(true);
  });
});
