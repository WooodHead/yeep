import { Schema } from 'mongoose';

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
      minlength: 2,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: 140,
    },
    isSystemRole: {
      type: Boolean,
      required: true,
      default: false,
    },
    permissions: {
      type: [Schema.Types.ObjectId],
      required: true,
    },
    scope: Schema.Types.ObjectId,
  },
  {
    collection: 'roles',
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

roleSchema.index(
  { name: 1 },
  {
    unique: true,
    name: 'name_uidx',
    collation: { locale: 'en', strength: 1 },
  }
);

roleSchema.index(
  { scope: 1 },
  {
    name: 'scope_idx',
  }
);

roleSchema.index(
  { permissions: 1 },
  {
    name: 'permission_idx',
  }
);

export default roleSchema;
