// Security Hardening and Migration Script (Backend Integrated)
// This script addresses the issues found during the security review.

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not found in environment. Please check your .env file at the project root.');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // 1. Drop the old unique email index if it exists
    console.log('Checking for old email index...');
    const indexes = await usersCollection.indexes();
    if (indexes.find(idx => idx.name === 'email_1')) {
      await usersCollection.dropIndex('email_1');
      console.log('Dropped unique index "email_1" [SUCCESS]');
    } else {
      console.log('Old email_1 index not found or already dropped.');
    }

    // 2. Clear all residual plaintextPassword fields
    console.log('Clearing plaintextPassword fields from all users...');
    const result = await usersCollection.updateMany(
      { plaintextPassword: { $exists: true } },
      { $unset: { plaintextPassword: "" } }
    );
    console.log(`Cleared plaintextPassword from ${result.modifiedCount} users. [SUCCESS]`);

    console.log('\nMigration completed successfully.');
    console.log('You can now safely restart the server.');
    process.exit(0);
  } catch (err) {
    console.error('\n[MIGRATION FAILED]:', err.message);
    process.exit(1);
  }
};

migrate();
// Run this with: node scripts/security_migration.js (from backend directory)
