const artTemplate = require('art-template');
const path = require('path');
const beautifyHTML = require('js-beautify').html;
const logUtil = require('gulp-util').log;
const FileMgr = require('./filemgr');

const errorM = (error) => {
	const filePath = (error.file === 'stdin' ? file.path : error.file) || file.path;
	const relativePath = path.relative(process.cwd(), filePath);
	const message = [chalk.underline(relativePath), error.formatted].join('\n');

	error.messageFormatted = message; // eslint-disable-line no-param-reassign
	error.messageOriginal = error.message; // eslint-disable-line no-param-reassign
	error.message = stripAnsi(message); // eslint-disable-line no-param-reassign
	error.relativePath = relativePath; // eslint-disable-line no-param-reassign
	return cb(new PluginError(PLUGIN_NAME, error));
};
function parseAttribute(str) {
	const attributes = {};
	String(str).replace(/(\w+)="([^"]*?)"/g, function withContent(_, name, content) {
		let value = content.trim();
		const numberic = Number(value);
		if (!isNaN(numberic)) {
			value = numberic;
		} else if (/^(false|true)$/i.test(value)) {
			value = value.toLowerCase() === 'true';
		}
		attributes[name] = value;
		return '';
	}).split(/\s+/).forEach(function noContent(name) {
		const prop = name.trim();
		if (/^\w+$/.test(prop)) {
			attributes[prop] = prop;
		}
	});
	return attributes;
}

function parseInnerHTML(str) {
	try {
		/* eslint-disable no-eval */
		const data = eval(`(${str})`);
		/* eslint-enable no-eval */
		if (data && typeof data === 'object') {
			return data;
		}
	/* eslint-disable no-empty */
	} catch (e) {}
	/* eslint-enable no-empty */
	const re = /<fragment[^>]*?id="(\w+)">([\s\S]*?)<\/fragment>/gi;
	const data = {};
	while (re.test(str)) {
		const value = RegExp.$2.trim();
		if (value) {
			data[RegExp.$1.trim()] = value;
		}
	}
	return data;
}


module.exports = function parse(args) {
	const config = Object(args);
	const tplTag = String(config.tag || 'template').toLowerCase();
	const dataTag = config.dataTag ? config.dataTag.toLowerCase() : false;
	const formatData = typeof config.formatData === 'function' ? config.formatData : null;
	const beautifyConf = Object.assign({
		indent_size: 4,
		indent_char: '\t',
		indent_with_tabs: true,
		preserve_newlines: true,
		max_preserve_newlines: 1
	}, config.beautify);
	const fileMgr = new FileMgr(config.paths);
	let log = logUtil;
	if (typeof config.log === 'function') {
		log = config.log;
	} else if (config.log === false) {
		log = Function.prototype;
	}

	function parseFile(src, data, base) {
		const content = fileMgr.readFile(src);
		if (content) {
			/* eslint-disable no-use-before-define */
			return parseContent(content, src, data);
			/* eslint-enable no-use-before-define */
		}
		throw({
			error: {
				message: `Template "${src}" not found or empty`,
				file: `${base}`
			}
		})
	}

	function parseContent(content, base, topData) {
		if (!content) {
			return '';
		}

		let selfData = Object.assign({}, topData);
		let html = content.toString();

		if (dataTag) {
			const re = new RegExp(`<${dataTag}\\b[\\s\\S]*?>([\\s\\S]*?)<\\/${dataTag}>`, 'gi');
			html = html.replace(re, function seperateDataTag(_, textContent) {
				try {
					/* eslint-disable no-eval */
					const data = eval(`(${textContent})`);
					/* eslint-enable no-eval */
					if (data && typeof data === 'object') {
						selfData = Object.assign({}, data, selfData);
					}
				/* eslint-disable no-empty */
				} catch (e) {}
				/* eslint-enable no-empty */
				return '';
			});
		}
		if (formatData) {
			selfData = formatData(selfData)
		}
		try {
			html = artTemplate.compile({
				source: html,
				bail: true
			})(selfData)
		} catch (error) {
			let messageList = error.message.split(':');
			throw({
				error: {
					message: messageList[3],
					type: error.name,
					line: messageList[1],
					column: parseInt(messageList[2]),
					file: `${base}`
				}
			})
		}

		const re = new RegExp(`<${tplTag}([\\s\\S]*?)>([\\s\\S]*?)<\\/${tplTag}>`, 'gi');
		const loadTpl = html.replace(re, function render(_, attrText, innerHTML) {
			const attribute = parseAttribute(attrText);
			const src = attribute.src;
			if (src) {
				const file = fileMgr.find(src, base);
				if (file) {
					const jsonData = parseInnerHTML(innerHTML);
					const data = Object.assign({}, selfData, attribute, jsonData);
					return parseFile(file, data, base);
				}
				throw({
					error: {
						message: `Template "${src}" not found or empty`,
						file: `${base}`
					}
				})
			}
			throw({
				error: {
					message: `Template Undefined src.`,
					file: `${base}`
				}
			})
		});
		return beautifyHTML(loadTpl, beautifyConf);
	}

	return { parseContent, parseFile };
};