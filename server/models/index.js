import orgSchema from './Org';
import userSchema from './User';
import authFactorSchema from './AuthFactor';
import tokenSchema from './Token';
import orgMembershipSchema from './OrgMembership';
import permissionSchema from './Permission';
import roleSchema from './Role';
import identityProviderSchema from './IdentityProvider';
import oauthIdentityProviderSchema from './IdentityProvider-OAuth';
import passwordSchema from './AuthFactor-Password';
import totpSchema from './AuthFactor-TOTP';
import { PASSWORD, TOTP } from '../constants/authFactorTypes';
import { OAUTH } from '../constants/idpProtocols';

export const registerModels = (db) => {
  db.model('Org', orgSchema);
  db.model('User', userSchema);
  db.model('Permission', permissionSchema);
  db.model('Role', roleSchema);
  db.model('OrgMembership', orgMembershipSchema);
  db.model('Token', tokenSchema);
  db.model('AuthFactor', authFactorSchema);
  db.model('AuthFactor').discriminator('Password', passwordSchema, PASSWORD); // 3rd param declares the "type" value
  db.model('AuthFactor').discriminator('TOTP', totpSchema, TOTP);
  db.model('IdentityProvider', identityProviderSchema);
  db.model('IdentityProvider').discriminator(
    'OAuthIdentityProvider',
    oauthIdentityProviderSchema,
    OAUTH
  );
};
