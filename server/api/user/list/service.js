import { ObjectId } from 'mongodb';
import escapeRegExp from 'lodash/escapeRegExp';
import invokeMap from 'lodash/invokeMap';
import pick from 'lodash/pick';

export const stringifyCursor = ({ id }) => {
  return Buffer.from(JSON.stringify(id)).toString('base64');
};

export const parseCursor = (cursorStr) => {
  const id = JSON.parse(Buffer.from(cursorStr, 'base64').toString('utf8'));
  return { id };
};

export const defaultProjection = {
  id: true,
  username: true,
  fullName: true,
  picture: true,
  emails: true,
  orgs: true,
  createdAt: true,
  updatedAt: true,
};

async function listUsers({ db }, { q, limit, cursor, scopes, projection = defaultProjection }) {
  const UserModel = db.model('User');
  const users = await UserModel.aggregate([
    {
      $match: q
        ? {
            username: {
              $regex: `^${escapeRegExp(q)}`,
              $options: 'i',
            },
          }
        : {},
    },
    {
      $lookup: {
        from: 'orgMemberships',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', '$$userId'] },
                  scopes.includes(null)
                    ? {
                        $eq: ['$orgId', null],
                      }
                    : {
                        $in: ['$orgId', scopes.map((scope) => ObjectId(scope))],
                      },
                ],
              },
            },
          },
          {
            $project: {
              _id: 0,
              orgId: 1,
            },
          },
        ],
        as: 'orgMemberships',
      },
    },
    {
      $match: Object.assign(
        {
          orgMemberships: {
            $not: { $size: 0 },
          },
        },
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
      $limit: limit,
    },
  ]);

  const fields = Object.entries(projection).reduce((accumulator, [key, value]) => {
    if (value) {
      return accumulator.concat(key);
    }
    return accumulator;
  }, []);

  // Please note: if you add a new prop to user, remember to update the defaultProjection obj
  return users.map((user) =>
    pick(
      {
        id: user._id.toHexString(),
        username: user.username,
        fullName: user.fullName,
        picture: user.picture,
        emails: user.emails,
        orgs: invokeMap(user.orgMemberships, 'orgId.toHexString'),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      fields
    )
  );
}

export default listUsers;
