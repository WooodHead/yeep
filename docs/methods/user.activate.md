# user.activate

`POST /api/user.activate`

## Description

Activates the designated user.

This function only makes sense if the user had previously been deactivated.

---

## Auth logic

Requestor must be authenticated and assigned with `yeep.user.write` permission in _global_ scope.

## Parameters

### Body

- **id** _(string)_ — user ID (required)

---

## Returns

**200 OK** alongside `Object` with the following properties:

- **ok** _(boolean)_ — indicates whether the request was successfully completed
- **error** _(Object)_ — contains error details in case of an error
- **user** _(Object)_ — updated user info

---

## Example

**Request**

```
POST /api/user.activate
Authorization: `Bearer ${authToken}`
```

```json
{
  "id": "507f191e810c19729de860ea"
}
```

**Response**

`200 OK`

```json
{
  "ok": true,
  "user": {
    "id": "507f191e810c19729de860ea",
    "deactivatedAt": null,
    "updatedAt": "2017-07-13T05:42:42.222Z"
  }
}
```
