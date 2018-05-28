import crypto from 'crypto';
import Promise from 'bluebird';
import { Schema } from 'mongoose';

const randomBytes = Promise.promisify(crypto.randomBytes);
const pbkdf2 = Promise.promisify(crypto.pbkdf2);

const emailSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    isPrimary: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    _id: false, // disable _id PK
  }
);

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
      minlength: 2,
    },
    password: {
      type: Buffer,
      required: true,
    },
    salt: {
      type: Buffer,
      required: true,
    },
    iterationCount: {
      type: Number,
      required: true,
      min: 1,
    },
    fullName: {
      type: String,
      required: false, // optional
      trim: true,
      maxlength: 100,
      minlength: 2,
    },
    picture: {
      type: String,
      required: false, // optional
      trim: true,
      maxlength: 500,
    },
    emails: [emailSchema],
    orgs: [Schema.Types.ObjectId],
    roles: [Schema.Types.ObjectId],
  },
  {
    collection: 'users',
    autoIndex: false,
    bufferCommands: false,
    _id: true, // enable _id PK
    id: true, // i.e. create `id` getter to retrieve _id in hex format
    minimize: false, // allow empty object
    strict: true, // reject values not specified in schema
    validateBeforeSave: true,
    versionKey: '_v',
    timestamps: true,
  }
);

userSchema.index(
  { username: 1 },
  {
    unique: true,
    name: 'username_uidx',
  }
);

userSchema.index(
  { 'emails.address': 1 },
  {
    unique: true,
    name: 'email_address_uidx',
  }
);

/**
 * Generates and returns a cryptographically secure pseudorandom buffer of 30 bytes.
 * @return {Promise<Buffer>} a Bluebird promise resolving to a Buffer.
 */
userSchema.statics.generatePassword = function() {
  return randomBytes(30);
};

/**
 * Generates and returns a cryptographically secure pseudorandom buffer of 128 bytes.
 * @return {Promise<Buffer>} a Bluebird promise resolving to a Buffer.
 */
userSchema.statics.generateSalt = function() {
  return randomBytes(128);
};

/**
 * Returns a secure hash of the designated password using the supplied salt and iterations count.
 * @param {string} password
 * @param {Buffer} salt
 * @param {number} iterations
 * @return {Promise<Buffer>}
 */
userSchema.statics.digestPassword = function(password, salt, iterations) {
  return pbkdf2(password, salt, iterations, 128, 'sha512');
};

export default userSchema;
