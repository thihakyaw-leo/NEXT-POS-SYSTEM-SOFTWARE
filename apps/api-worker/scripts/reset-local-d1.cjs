const fs = require('fs');
const path = require('path');

const d1Dir = path.join(__dirname, '..', '.wrangler', 'state', 'v3', 'd1');
if (!fs.existsSync(d1Dir)) {
	console.log('No local D1 directory (already clean):', d1Dir);
	process.exit(0);
}

try {
	fs.rmSync(d1Dir, { recursive: true, force: true });
	console.log('Removed local D1 files:', d1Dir);
} catch (e) {
	if (e && (e.code === 'EPERM' || e.code === 'EBUSY')) {
		console.error(
			'Cannot delete local D1 (folder is locked). Stop api-worker first (Ctrl+C on `npm run dev` / `wrangler dev`), then run this command again.'
		);
		process.exit(1);
	}
	throw e;
}
