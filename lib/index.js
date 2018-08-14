const through = require('through2');
const createParser = require('./parser');
const PluginError= require('plugin-error');
const PLUGIN_NAME = 'gulp-html-tpl';
module.exports = function plugin(options) {
	const initialData = Object(options.data);
	const parseContent = createParser(options).parseContent;

	return through.obj(function compile(file, encoding, callback) {
		if (file.isBuffer()) {
			try {
				const content = parseContent(file.contents, file.path, initialData);
				const ref = file;
				ref.contents = new Buffer(content);
				this.push(ref);
			} catch (error) {
				return callback(new PluginError(PLUGIN_NAME, error));
			}
			return callback()
		} else {
			return callback(new PluginError(PLUGIN_NAME, {
				message: 'file is not Buffer'
			}));
		}
	});
};