/*
 * CSS to JS for Grunt
 * git://github.com/mutian/grunt-css-to-js.git
 *
 * Copyright (c) 2015 Mutian Wang
 * Licensed under the MIT license.
 */

'use strict';

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
  grunt.registerMultiTask('css_to_js', 'Convert CSS to JS', function() {
    var options = this.options({
      charset: '@charset "utf-8";',
      baseUrl: '/',       // base url
      baseDir: '.',       // local base dir
      regFn: 'jcssReg'    // js register function
    });
    
    var combinedMap = {};
    var fileVersMap = {};

    var combine = function(gruntRelPath) {
      if (combinedMap[gruntRelPath]) {
        // console.log('\t▲ return from combinedMap');
        return combinedMap[gruntRelPath];
      }

      var gruntRelDir = path.dirname(gruntRelPath);
      var fileContent = grunt.file.read(gruntRelPath);

      // remove BOM
      fileContent = fileContent.replace(/^\xef\xbb\xbf/, '');

      // remove comments
      fileContent = fileContent.replace(/\/\*[\s\S]*?\*\//g, '');

      // remove @charset
      fileContent = fileContent.replace(/@charset[^;]+;\s*/ig, '');

      // import
      fileContent = fileContent.replace(/\s*@import\s*?(?: url\(\s*)?(['"])?((?!\/)[\w\-\.\/\?=]+)\1\s*\)?\s*;/ig, function(matchString, quote, importRelPath) {
        var gruntRelImportPath = path.join(gruntRelDir, importRelPath).replace(/\\/g, '/');
        console.log('\t@import: ' + gruntRelImportPath);
        return combine(gruntRelImportPath);
      });

      // relative url to absolute
      fileContent = fileContent.replace(/url\(\s*(['"]?)((?!\/)[\w\-\.\/\?=]+)\1\s*\)/ig, function(matchString, quote, relUrl) {
        var gruntRelUrl = path.join(gruntRelDir, relUrl).replace(/\\/g, '/');
        var baseRelUrl = path.relative(options.baseDir, getVersionedUrl(gruntRelUrl)).replace(/\\/g, '/');
        var absUrl = options.baseUrl + baseRelUrl;
        return matchString.replace(relUrl, absUrl);
      });

      combinedMap[gruntRelPath] = fileContent;
      return fileContent;
    };

    var getVersionedUrl = function(filePath) {
      var ver = fileVersMap[filePath];
      if (typeof ver === 'undefined') {
        ver = getFileVersion(filePath.replace(/(\.[A-Za-z0-9]+)(\?[\w\-=]+)?$/, '$1'));
        fileVersMap[filePath] = ver;
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
        for (var i in hexArr) {
          num = parseInt(hexArr[i], 16);
          ver.push(b64Map[num >> 5 & 0x3F]);  // 取出中间6位转换为64进制
        }
        return ver.join('');
      } catch (e) {
        console.warn('\t[Warn] File not exist: ' + filePath);
        return '0';
      }
    };

    var compress = function(fileContent) {
      return options.charset + fileContent.replace(/\s*([\{\}:;,])\s*/g, '$1')
        .replace(/\s+!important/ig, '!important')
        .replace(/;\}/g, '}')
        .replace(/\n+/g, '')
        .replace(/^\s*(\S+(\s+\S+)*)\s*$/, '$1');
    };

    var css2js = function(cssContent, filePath) {
      var code = cssContent.replace(/\'/g, "\\'");
      var path = filePath.replace(/^(.*)\.css$/i, '$1');
      return options.regFn + "('" + path + "', '" + code + "');";
    };

    this.files.forEach(function(fileGroup) {
      var dirMode = fileGroup.cwd;
      fileGroup.src.map(function(filePath) {
        var gruntRelPath = (dirMode ? path.join(fileGroup.cwd, filePath) : filePath).replace(/\\/g, '/');
        var destPath = (dirMode ? path.join(fileGroup.dest, filePath) : fileGroup.dest).replace(/^(.*)\.css$/i, '$1.js');
        console.log('css2js:\t' + gruntRelPath);
        var cssContent = compress(combine(gruntRelPath));
        var jsContent = css2js(cssContent, filePath);
        grunt.file.write(destPath, jsContent);
      });
    });
    
  });
};
