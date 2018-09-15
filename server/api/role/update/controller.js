import Joi from 'joi';
import Boom from 'boom';
import compose from 'koa-compose';
import packJSONRPC from '../../../middleware/packJSONRPC';
import { validateRequest } from '../../../middleware/validation';
import {
  visitSession,
  isUserAuthenticated,
  visitUserPermissions,
  isUserAuthorized,
} from '../../../middleware/auth';
import updateRole from './service';
import getRoleInfo from '../info/service';

const validationSchema = {
  body: {
    id: Joi.string()
      .length(24)
      .hex()
      .required(),
    name: Joi.string()
      .lowercase()
      .trim()
      .min(2)
      .max(64)
      .optional()
      .regex(/^[A-Za-z0-9_\-.:]*$/, { name: 'role' }),
    description: Joi.string()
      .trim()
      .max(140)
      .optional(),
    permissions: Joi.array()
      .items(
        Joi.string()
          .length(24)
          .hex()
      )
      .min(1)
      .max(100)
      .single()
      .unique()
      .optional(),
  },
};

const visitRequestedRole = async ({ request, db }, next) => {
  const role = await getRoleInfo(db, request.body);

  // visit session object with requested role data
  request.session = {
    ...request.session,
    role,
  };

  await next();
};

async function handler({ request, response, db }) {
  const { name, description, permissions } = request.body;

  // ensure name or description have been specified
  if (!(name || description || permissions)) {
    const boom = Boom.badRequest('Invalid request body');
    boom.output.payload.details = [
      {
        path: ['name'],
        type: 'any.required',
      },
    ];
    throw boom;
  }

  const role = await updateRole(db, request.session.role, {
    name,
    description,
    permissions,
  });

  response.status = 200; // OK
  response.body = {
    role,
  };
}

export default compose([
  packJSONRPC,
  visitSession(),
  isUserAuthenticated(),
  validateRequest(validationSchema),
  visitRequestedRole,
  visitUserPermissions(),
  isUserAuthorized({
    permissions: ['yeep.role.write'],
    org: (request) => request.session.role.scope,
  }),
  handler,
]);
