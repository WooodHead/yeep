/* eslint-env jest */
import request from 'supertest';
import server from '../../../server';
import deleteOrg from '../delete/service';
import createOrg from './service';

describe('api/v1/org.create', () => {
  let ctx;

  beforeAll(async () => {
    await server.setup();
    ctx = server.getAppContext();
  });

  afterAll(async () => {
    await server.teardown();
  });

  test('returns error when `slug` contains invalid characters', async () => {
    const res = await request(server)
      .post('/api/v1/org.create')
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
      .post('/api/v1/org.create')
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
      .post('/api/v1/org.create')
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
      .post('/api/v1/org.create')
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
      .post('/api/v1/org.create')
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
      .post('/api/v1/org.create')
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
      .post('/api/v1/org.create')
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

    const isOrgDeleted = await deleteOrg(ctx.db, res.body.org);
    expect(isOrgDeleted).toBe(true);
  });

  test('returns error on duplicate org slug', async () => {
    const org = await createOrg(ctx.db, {
      name: 'ACME Inc.',
      slug: 'acme',
    });

    const res = await request(server)
      .post('/api/v1/org.create')
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

    const isOrgDeleted = await deleteOrg(ctx.db, org);
    expect(isOrgDeleted).toBe(true);
  });
});
