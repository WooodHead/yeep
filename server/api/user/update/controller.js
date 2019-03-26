import Joi from 'joi';
import Boom from 'boom';
import compose from 'koa-compose';
import packJSONRPC from '../../../middleware/packJSONRPC';
import { validateRequest } from '../../../middleware/validation';
import {
  decorateSession,
  isUserAuthenticated,
  decorateUserPermissions,
  findUserPermissionIndex,
} from '../../../middleware/auth';
import updateUser from './service';
import getUserInfo from '../info/service';
import { AuthorizationError } from '../../../constants/errors';

export const validationSchema = {
  body: {
    id: Joi.string()
      .length(24)
      .hex()
      .required(),
    username: Joi.string()
      .lowercase()
      .trim()
      .min(2)
      .max(30)
      .optional()
      .regex(/^[A-Za-z0-9_\-.]*$/, { name: 'username' }),
    password: Joi.string()
      .trim()
      .min(8)
      .max(50)
      .optional(),
    fullName: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .optional(),
    emails: Joi.array()
      .items(
        Joi.object()
          .unknown(false)
          .keys({
            address: Joi.string()
              .trim()
              .email()
              .max(100)
              .required(),
            isVerified: Joi.boolean()
              .default(false)
              .optional(),
            isPrimary: Joi.boolean()
              .default(false)
              .optional(),
          })
          .required()
      )
      .min(1)
      .max(10)
      .unique((a, b) => a.address === b.address)
      .optional(),
    orgs: Joi.array()
      .items(
        Joi.string()
          .length(24)
          .hex()
      )
      .min(1)
      .max(10)
      .single()
      .unique()
      .default([])
      .optional(),
  },
};

const isRequestorAllowedToEditUser = (requestorPermissions, orgId) => {
  const hasUserReadPermissions =
    findUserPermissionIndex(requestorPermissions, {
      name: 'yeep.user.Write',
      orgId,
    }) !== -1;
  const hasPermissionsAssignmentWrite =
    findUserPermissionIndex(requestorPermissions, {
      name: 'yeep.permission.assignment.Write',
      orgId,
    }) !== -1;
  const hasRoleAssignmentWrite =
    findUserPermissionIndex(requestorPermissions, {
      name: 'yeep.role.assignment.Write',
      orgId,
    }) !== -1;

  // TODO: uncomment this and check if they are needed
  // return hasUserReadPermissions && (hasPermissionsAssignmentWrite || hasRoleAssignmentWrite);
  return hasUserReadPermissions;
};

const isUserAuthorized = async ({ request }, next) => {
  const isUserRequestorIdentical = request.session.user.id === request.body.id;
  const hasPermission = Array.from(new Set([...request.session.requestedUser.orgs, null])).some(
    (orgId) => isRequestorAllowedToEditUser(request.session.user.permissions, orgId)
  );

  if (!isUserRequestorIdentical && !hasPermission) {
    throw new AuthorizationError(
      `User ${request.session.user.id} does not have sufficient permissions to access this resource`
    );
  }

  await next();
};

const decorateRequestedUser = async (ctx, next) => {
  const { request } = ctx;
  const user = await getUserInfo(ctx, request.body);

  // decorate session object with requested user data
  request.session = {
    ...request.session,
    requestedUser: user,
  };

  await next();
};

async function handler(ctx) {
  const { request, response } = ctx;
  // const { name, description } = request.body;

  // // ensure name or description have been specified
  // if (!(name || description)) {
  //   const boom = Boom.badRequest('Invalid request body');
  //   boom.output.payload.details = [
  //     {
  //       path: ['name'],
  //       type: 'any.required',
  //     },
  //   ];
  //   throw boom;
  // }

  const user = await updateUser(ctx, request.session.requestedUser, request.body);

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
  decorateRequestedUser,
  isUserAuthorized,
  handler,
]);
