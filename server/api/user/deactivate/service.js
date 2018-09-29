import { ObjectId } from 'mongodb';
import addSeconds from 'date-fns/add_seconds';
import { UserNotFoundError } from '../../../constants/errors';

async function deactivateUser(db, { id, ttl = 0 }) {
  const UserModel = db.model('User');
  const deactivatedAt = addSeconds(new Date(), ttl);

  // ensure user exists
  const user = await UserModel.findOne({ _id: ObjectId(id) });

  if (!user) {
    throw new UserNotFoundError('User does not exist');
  }

  // update user
  await UserModel.updateOne(
    {
      _id: user._id,
    },
    {
      $set: {
        deactivatedAt,
      },
    }
  );

  return {
    id: user._id.toHexString(),
    deactivatedAt,
  };
}

export default deactivateUser;
