import { ObjectId } from 'mongodb';
import flow from 'lodash/fp/flow';
import get from 'lodash/fp/get';
import filter from 'lodash/fp/filter';
import map from 'lodash/fp/map';
import uniq from 'lodash/fp/uniq';
import escapeRegExp from 'lodash/escapeRegExp';

export const stringifyCursor = ({ id }) => {
  return Buffer.from(JSON.stringify(id)).toString('base64');
};

export const parseCursor = (cursorStr) => {
  const id = JSON.parse(Buffer.from(cursorStr, 'base64').toString('utf8'));
  return { id };
};

export const getScopesFromRequest = flow(
  get(['session', 'user', 'permissions']),
  filter((permission) => permission.name === 'yeep.role.read'),
  map((permission) => permission.orgId || null),
  uniq
);

async function listRoles(db, { q, limit, cursor, scopes }) {
  const RoleModel = db.model('Role');

  // retrieve roles
  const roles = await RoleModel.aggregate([
    {
      $match: Object.assign(
        scopes.includes(null)
          ? {}
          : {
              scope: { $in: scopes.map((scope) => ObjectId(scope)) },
            },
        q
          ? {
              name: {
                $regex: `^${escapeRegExp(q)}`,
                $options: 'i',
              },
            }
          : {},
        cursor
          ? {
              _id: {
                $gt: ObjectId(cursor.id),
              },
            }
          : {}
      ),
    },
    {
      $lookup: {
        from: 'roleAssignments',
        let: { roleId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$role', '$$roleId'],
              },
            },
          },
          {
            $group: {
              _id: '$user',
            },
          },
        ],
        as: 'users',
      },
    },
    {
      $limit: limit,
    },
  ]);

  return roles.map((role) => ({
    id: role._id.toHexString(),
    name: role.name,
    description: role.description,
    isSystemRole: role.isSystemRole,
    permissions: role.permissions,
    usersCount: role.users.length,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  }));
}

export default listRoles;
