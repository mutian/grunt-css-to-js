/**
 * JCSS
 *
 * Grunt参数：
 *   baseUrl: 项目起始url
 *   baseSrc: 项目起始目录
 *   regFn: jcss注册方法名
 *   cwd: css源文件目录
 *   dst: jcss输出目录
 *
 * 变量命名:
 *   cwd: grunt下的工作目录
 *   dst: 输出目录
 *   gruntRelPath, gruntRelDir: 相对grunt目录的文件、目录路径
 *   baseSrc: 项目起始目录
 *   baseUrl: 项目起始url
 *   baseRelUrl: 相对起始url的相对url
 */

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var b64Map = [
	'0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
	'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
	'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
	'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D',
	'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
	'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
	'Y', 'Z', '-', '_'
];

module.exports = function(grunt) {
	grunt.registerMultiTask('jcss', function() {
		options = this.options({
			charset: '@charset "UTF-8";'
		});
		
		var baseSrc = null;
		var baseUrl  = null;
		var regFn = null;
		var combineCache = {};
		var fileVers = {};

		var combine = function(gruntRelPath) {
			if (combineCache[gruntRelPath]) {
				// console.log('\t▲ return from combineCache');
				return combineCache[gruntRelPath];
			}

			var gruntRelDir = path.dirname(gruntRelPath);
			var fileContent = grunt.file.read(gruntRelPath);

			// 去注释
			fileContent = fileContent.replace(/\/\*[\s\S]*?\*\//g, '');

			// import
			fileContent = fileContent.replace(/\s*@import\s*?(?: url\(\s*)?(['"])?([^\/][\w\-\.\/\?=]+)\1\s*\)?\s*;/ig, function(matchString, quote, importRelPath) {
				var gruntRelImportPath = path.join(gruntRelDir, importRelPath).replace(/\\/g, '/');
				console.log('\t@import: ' + gruntRelImportPath);
				return combine(gruntRelImportPath);
			});

			// url处理（不处理绝对路径）
			fileContent = fileContent.replace(/url\(\s*(['"]?)([^\/][\w\-\.\/\?=]+)\1\s*\)/ig, function(matchString, quote, relUrl) {
				var gruntRelUrl = path.join(gruntRelDir, relUrl).replace(/\\/g, '/');
				var baseRelUrl = path.relative(baseSrc, getVersionedUrl(gruntRelUrl)).replace(/\\/g, '/');
				var absUrl = baseUrl + baseRelUrl;
				return matchString.replace(relUrl, absUrl);
			});

			combineCache[gruntRelPath] = fileContent;
			return fileContent;
		};

		var getVersionedUrl = function(filePath) {
			var ver = fileVers[filePath];
			if (typeof ver === 'undefined') {
				ver = getFileVersion(filePath.replace(/(\.[A-Za-z0-9]+)(\?[\w\-=]+)?$/, '$1'));
				fileVers[filePath] = ver;
			}
			return filePath.replace(/(\.[A-Za-z0-9]+)(\?[\w\-=]+)?$/, '$1?v=' + ver);
		};

		var getFileVersion = function(filePath) {
			try {
				// var fileContent = grunt.file.read(filePath);
				var fileContent = fs.readFileSync(filePath, 'utf8');
				var hexMd5 = crypto.createHash('md5').update(fileContent).digest('hex');
				// 每16位（4位16进制）为一组，md5的值可分为8组
				var hexArr = hexMd5.replace(/(\w)(?=(\w{4})+$)/g, '$1-').split('-');
				var num = null;
				var ver = [];
				for (i in hexArr) {
					num = parseInt(hexArr[i], 16);
					ver.push(b64Map[num >> 5 & 0x3F]);	// 取出中间6位转换为64进制
				}
				return ver.join('');
			} catch (e) {
				console.error('\tFile not exist: ' + filePath);
				return '0';
			}
		};

		var compress = function(fileContent) {
			return options.charset + fileContent.replace(/\s*([\{\}:;,])\s*/g, '$1')
				.replace(/\s+!important/ig, '!important')
				.replace(/@charset[^;]+;/ig, '')
				.replace(/;\}/g, '}')
				.replace(/\n+/g, '')
				.replace(/^\s*(\S+(\s+\S+)*)\s*$/, '$1');
		};

		var css2js = function(cssContent, cssPath) {
			var code = cssContent.replace(/\'/g, "\\'");
			var ns = cssPath.replace(/^(.*)\.css$/i, '$1');
			return regFn + "('" + ns + "', '" + code + "');";
		};

		this.files.forEach(function(file) {
			baseSrc = file.baseSrc;
			baseUrl = file.baseUrl;
			regFn = file.regFn;
			file.src.map(function(cssPath) {
				var gruntRelPath = path.join(file.cwd, cssPath).replace(/\\/g, '/');
				var jcssPath = path.join(file.dst, cssPath).replace(/^(.*)\.css$/i, '$1.js');
				console.log('jcss:\t' + gruntRelPath);
				var cssContent = compress(combine(gruntRelPath));
				var jcssContent = css2js(cssContent, cssPath);
				grunt.file.write(jcssPath, jcssContent);
			});
		});
		
	});
};
