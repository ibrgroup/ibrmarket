/**
 * One-off CLI: set user.role in MongoDB (e.g. promote to ADMIN for local testing).
 *
 * Usage (from server/):
 *   node scripts/set-user-role.js --email you@example.com --role ADMIN
 *   node scripts/set-user-role.js --mobile 79991234567 --role ADMIN
 *   node scripts/set-user-role.js --id 507f1f77bcf86cd799439011 --role USER
 *
 * Requires MONGODB_URI in .env (same as the API server).
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Load after .env so connectDb's MONGODB_URI check does not run too early.
const { default: connectDB } = await import('../config/connectDb.js');
const { default: UserModel } = await import('../models/user.model.js');

const ROLES = ['USER', 'ADMIN', 'MODERATOR', 'SUPPORT', 'MANAGER', 'SELLER'];

function parseArgs(argv) {
	const out = {};
	for (let i = 2; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--email' || a === '--mobile' || a === '--phone' || a === '--id' || a === '--role') {
			const key = a === '--phone' ? 'mobile' : a.slice(2);
			out[key] = argv[i + 1];
			i++;
		}
	}
	return out;
}

/** Normalize Russian mobile to 7 + 10 digits (matches user.model validator). */
function normalizeMobile(raw) {
	if (!raw) return null;
	let d = String(raw).replace(/\D/g, '');
	if (d.length === 11 && d.startsWith('8')) d = `7${d.slice(1)}`;
	if (d.length === 10 && d.startsWith('9')) d = `7${d}`;
	if (d.length === 11 && d.startsWith('7')) return d;
	return null;
}

function usage() {
	console.error(`
Usage:
  node scripts/set-user-role.js --email <address> --role <ROLE>
  node scripts/set-user-role.js --mobile <7XXXXXXXXXX> --role <ROLE>
  node scripts/set-user-role.js --id <MongoObjectId> --role <ROLE>

  ROLE: USER | ADMIN | MODERATOR | SUPPORT | MANAGER | SELLER

.env is loaded from the server directory (next to this script's parent).
`);
}

async function main() {
	const args = parseArgs(process.argv);
	const role = args.role?.toUpperCase();

	if (!role || !ROLES.includes(role)) {
		usage();
		console.error('Error: provide a valid --role (see usage)');
		process.exit(1);
	}

	let filter = null;
	if (args.email) {
		filter = { email: String(args.email).trim().toLowerCase() };
	} else if (args.mobile) {
		const mobile = normalizeMobile(args.mobile);
		if (!mobile) {
			console.error('Error: --mobile must be a Russian mobile (e.g. 79991234567 or 89991234567)');
			process.exit(1);
		}
		filter = { mobile };
	} else if (args.id) {
		if (!mongoose.Types.ObjectId.isValid(args.id)) {
			console.error('Error: --id is not a valid ObjectId');
			process.exit(1);
		}
		filter = { _id: new mongoose.Types.ObjectId(args.id) };
	}

	if (!filter) {
		usage();
		console.error('Error: specify exactly one of --email, --mobile, or --id');
		process.exit(1);
	}

	const ok = await connectDB();
	if (!ok) {
		process.exit(1);
	}

	try {
		const updated = await UserModel.findOneAndUpdate(
			filter,
			{ $set: { role } },
			{ new: true, runValidators: true },
		);

		if (!updated) {
			console.error('No user matched. Check email/mobile/id and database name in MONGODB_URI.');
			process.exit(2);
		}

		console.log('Updated user:');
		console.log({
			id: String(updated._id),
			name: updated.name,
			email: updated.email,
			mobile: updated.mobile,
			role: updated.role,
		});
	} finally {
		await mongoose.connection.close();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
