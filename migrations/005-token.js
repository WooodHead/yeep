export const up = async (db) => {
  await db.collection('tokens').createIndex(
    { user: 1 },
    {
      name: 'user_idx',
    }
  );
};

export const down = async (db) => {
  await db.collection('tokens').dropIndex('user_idx');
};
