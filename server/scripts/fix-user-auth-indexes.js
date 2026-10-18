/**
 * One-off CLI: fix User auth indexes for OTP login.
 *
 * Why:
 * - old unique indexes may treat null as a value
 * - phone auth creates users without email
 * - this could cause "email already exists" on phone OTP
 *
 * Usage (from server/):
 *   node scripts/fix-user-auth-indexes.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { default: connectDB } = await import('../config/connectDb.js');
const { default: UserModel } = await import('../models/user.model.js');

async function dropIndexIfExists(collection, name) {
	try {
		await collection.dropIndex(name);
		console.log(`✅ Dropped index: ${name}`);
	} catch (error) {
		// MongoDB throws if index does not exist.
		if (error?.codeName === 'IndexNotFound') {
			console.log(`ℹ️ Index not found (skip): ${name}`);
			return;
		}
		throw error;
	}
}

async function main() {
	const ok = await connectDB();
	if (!ok) process.exit(1);

	try {
		const collection = UserModel.collection;

		// Drop legacy indexes that can conflict with partial indexes.
		await dropIndexIfExists(collection, 'email_1');
		await dropIndexIfExists(collection, 'mobile_1');

		// Cleanup legacy empty-string values before creating unique indexes.
		// This guarantees that "missing contact" stays outside index uniqueness.
		const [emailCleanup, mobileCleanup] = await Promise.all([
			collection.updateMany({ email: '' }, { $unset: { email: 1 } }),
			collection.updateMany({ mobile: '' }, { $unset: { mobile: 1 } }),
		]);
		console.log(
			`✅ Cleanup done: email='' -> unset (${emailCleanup.modifiedCount}), mobile='' -> unset (${mobileCleanup.modifiedCount})`,
		);

		// Rebuild indexes from schema (partial unique for non-empty strings only).
		await UserModel.syncIndexes();
		const indexes = await collection.indexes();

		console.log('✅ User indexes synced successfully');
		console.log(indexes);
	} finally {
		await mongoose.connection.close();
	}
}

main().catch((error) => {
	console.error('❌ Failed to fix user auth indexes:', error);
	process.exit(1);
});
