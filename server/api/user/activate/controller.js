import Joi from 'joi';
import compose from 'koa-compose';
import packJSONRPC from '../../../middleware/packJSONRPC';
import { validateRequest } from '../../../middleware/validation';
import {
  decorateSession,
  isUserAuthenticated,
  decorateUserPermissions,
  findUserPermissionIndex,
} from '../../../middleware/auth';
import activateUser from './service';
import { AuthorizationError } from '../../../constants/errors';

export const validationSchema = {
  body: {
    id: Joi.string()
      .length(24)
      .hex()
      .required(),
  },
};

const isUserAuthorized = async ({ request }, next) => {
  const hasPermission =
    findUserPermissionIndex(request.session.user.permissions, {
      name: 'yeep.user.write',
      orgId: null, // global org scope
    }) !== -1;

  if (!hasPermission) {
    throw new AuthorizationError(
      `User ${request.session.user.id} does not have sufficient permissions to access this resource`
    );
  }

  await next();
};

async function handler(ctx) {
  const { request, response } = ctx;
  const user = await activateUser(ctx, request.body);

  response.status = 200; // OK
  response.body = {
    user,
  };
}

export default compose([
  packJSONRPC,
  decorateSession(),
  isUserAuthenticated(),
  validateRequest(validationSchema),
  decorateUserPermissions(),
  isUserAuthorized,
  handler,
]);
