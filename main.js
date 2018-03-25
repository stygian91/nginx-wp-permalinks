const fs = require('fs');
const Promise = require('bluebird');
const appendFile = Promise.promisify(fs.appendFile);
const cmd = require('node-cmd');
getAsync = Promise.promisify(cmd.get, { multiArgs: true, context: cmd });

const snippetPath = '/etc/nginx/snippets/wp-permalinks.conf';

if (process.argv.length !== 3) {
	console.log('Usage: sudo node main.js <wp-location>');
	return;
}

var path = process.argv[2];
if (path.indexOf('/') !== 0) {
	path = '/' + path;
}

if (path.lastIndexOf('/') === path.length - 1) {
	path = path.slice(0, path.length - 1);
}

const locationFile = fs.readFileSync(snippetPath, {encoding: 'utf8'});

if (locationFile.includes(`location ${path}`)) {
	console.log(`Location already in ${path}, skipping.`);
	return;
}

var locationRule =
`location ${path} {
	try_files $uri $uri/ ${path}/index.php?$args;
}

`;

appendFile(
	snippetPath,
	locationRule,
	{ mode: 0644 },
	(err) => { if (err) { throw err; } }
)
.then(() => {
	console.log(`${path} updated successfully.`);
	console.log('Restarting nginx...');
	return getAsync('nginx -s reload');
})
.then(() => {
	console.log('Nginx restarted successfully.');
})
.catch((err) => {
	console.error(err);
});
