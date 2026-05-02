const { spawnSync } = require('node:child_process');

const token = process.env.SONAR_TOKEN?.trim();

if (!token) {
	console.error('SONAR_TOKEN não definido. Exemplo (PowerShell): $env:SONAR_TOKEN="seu_token"');
	process.exit(1);
}

const result = spawnSync('sonar-scanner', [`-Dsonar.token=${token}`], {
	stdio: 'inherit',
	shell: true,
});

process.exit(result.status ?? 1);
