const { spawnSync } = require('child_process');
const path = require('path');

const apiWorkerRoot = path.join(__dirname, '..');
const sqlFile = path.resolve(
	apiWorkerRoot,
	'..',
	'..',
	'packages',
	'database',
	'drizzle',
	'0000_secret_carmella_unuscione.sql'
);

const r = spawnSync(
	'npx',
	['wrangler', 'd1', 'execute', 'next-hr-db', '--local', '--file', sqlFile],
	{
		cwd: apiWorkerRoot,
		encoding: 'utf8',
		shell: true,
	}
);

const out = `${r.stdout || ''}${r.stderr || ''}`;
if (r.status === 0) {
	console.log(out.trim() || 'Local D1 migration applied.');
	process.exit(0);
}

if (/already exists/i.test(out)) {
	console.log('Local D1 already has this schema (tables exist). Nothing to do.');
	console.log('To wipe all local data and re-run migrations: npm run db:fresh:local');
	process.exit(0);
}

console.error(out || r.error || 'wrangler d1 execute failed');
process.exit(r.status ?? 1);
