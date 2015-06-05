## Getting Started
This plugin requires Grunt `>=0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install css-to-js --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('css-to-js');
```


## The "css_to_js" task

### Overview
In your project's Gruntfile, add a section named `css_to_js` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  css_to_js: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```


### Options

#### options.baseUrl
Type: `String`
Default value: `'/'`

A string value that is used to set base url when the project is published.

#### options.baseDir
Type: `String`
Default value: `'.'`

A string value that is used to set the local directory of `options.baseUrl`.

#### options.regFn
Type: `String`
Default value: `'jcssReg'`

A string value that is used to set the name of JavaScript register function.

### Usage Examples

#### Single File
In this example, `src/css/foo.css` will be converted to `dist/jcss/foo.js`. In the process, the relative urls in url() functions will be converted to absolute urls which start with `options.baseUrl`, then output a JavaScript function `jcssReg('css/foo', 'Some css code...')`.

Gruntfile.js
```js
grunt.initConfig({
  css_to_js: {
    options: {
      baseUrl: 'http://cdn.domain.com/abc/',
      baseDir: 'src/',
      regFn: 'jcssReg'
    },
    images: {
      files: {
        'dist/jcss/foo.js': ['src/css/foo.css']
      }
    }
  },
});
```

src: `src/css/foo.css`
```css
@charset "utf-8";
/* Icon */
.demoA{background:url(../images/a.png) no-repeat;}
.demoB{background:url(img/b.png) no-repeat;}
```

output: `dist/jcss/foo.js`
```
jcssReg('css/foo', '@charset "UTF-8";.demoA{background:url(http://cdn.domain.com/abc/images/a.png?v=tb3H6AEo) no-repeat}.demoB{background:url(http://cdn.domain.com/abc/css/img/b.png?v=4rdNjIPK) no-repeat}');
```

#### Specify Directory
In this example, all the CSS files in `src/css` will be converted to JS files.

```js
grunt.initConfig({
  css_to_js: {
    options: {
      baseUrl: 'http://cdn.domain.com/abc/',
      baseDir: 'src/',
      regFn: 'jcssReg'
    },
    files: [{
      cwd: 'src/css',
      src: ['**/*.css'],
      dest: 'dist/jcss'
    }]
  },
});
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).


## Release History

### 0.1.1 (2015-06-01)

* Initial Release

### 0.1.2 (2015-06-05)

* Optimize the regular expression of relative url
