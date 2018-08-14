const fs = require('fs');
const path = require('path');

function sep(str) {
	return str ? String(str).replace(/\\|\//g, path.sep) : '';
}

function isReadale(file) {
	try {
		const mode = 'R_OK' in fs ? fs.R_OK : fs.constants.R_OK;
		fs.accessSync(file, mode);
	} catch (e) {
		return false;
	}
	return true;
}

function readdir(dir) {
	const dirpath = path.resolve(dir);
	const result = [];
	if (fs.existsSync(dirpath)) {
		fs.readdirSync(dirpath).forEach(function append(file) {
			const filepath = path.join(dirpath, file);
			if (fs.lstatSync(filepath).isDirectory()) {
				result.push.apply(result, readdir(filepath));
			} else {
				result.push(sep(filepath));
			}
		});
	}
	return result;
}

function FileMgr(dirs) {
	this.paths = Array.isArray(dirs) ? dirs.slice() : [String(dirs).toString()];
	this.cachedFiles = null;
}

FileMgr.prototype.files = function files() {
	if (!this.cachedFiles) {
		const filenames = this.paths.map(readdir);
		if (!filenames.length) {
			return [];
		}
		const first = filenames.shift();
		this.cachedFiles = first.concat.apply(first, filenames).reduce(function append(arr, name) {
			if (arr.indexOf(name) < 0) {
				arr.push(name);
			}
			return arr;
		}, []);
	}
	return this.cachedFiles;
};

FileMgr.prototype.find = function find(src, base) {
	if (base) {
		const dir = path.parse(base).dir;
		const filename = path.resolve(dir, src);
		if (isReadale(filename)) {
			return filename;
		}
	}
	const filename = sep(src);
	return this.files().find(function match(file) {
		return file.indexOf(filename) > -1;
	});
};

FileMgr.prototype.readFile = function readFile(file) {
	try {
		return fs.readFileSync(file, { encoding: 'utf8' });
	} catch (e) {
		return '';
	}
};

module.exports = FileMgr;