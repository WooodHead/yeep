# session.create

`POST /api/v1/session.create`

## Description

Creates new session, a.k.a. sign-in, for the designated user.

***

## Parameters

### Body

- **userKey** _(string)_ — username or email address of the user (required)
- **password** _(string)_ — user password (required)

***

## Returns

**200 OK** alongside `Object` with the following properties:

- **ok** _(boolean)_ — indicates whether the request was successfully completed
- **error** _(Object)_ — contains error details in case of an error
- **token** _(string)_ — session token
- **expiresIn** _(string)_ — session expiration time (in seconds)

***

## Example

**Request**

```
POST /api/v1/session.create
```

``` json
{
  "userKey": "coyote@acme.com",
  "password": "catch-the-b1rd$"
}
```

**Response**

`200 OK`

``` json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ",
  "expiresIn": 604800
}
```