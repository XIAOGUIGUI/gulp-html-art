本插件用于在 HTML 中引入其他 HTML 片段，同时支持多目录查询和art-template模板渲染。



使用方法举例如下（参见 example）：

gulpfile.js：


```javascript
const gulp = require('gulp');
const htmlArt = require('gulp-html-art');

gulp.task('default', function() {
	return gulp.src('html/component/index.html')
		.pipe(htmlArt({
			paths: ['./html/common'],
			formatData: function(data) {
				 return data
			},
			data: {
				useHeader: false
			},
			beautify: {
				indent_char: ' ',
				indent_with_tabs: false
			}
		}))
		.pipe(gulp.dest('./dist'));
});
```

html/component/index.html：

```html
<template src="head.html" title="Hello World"></template>
<main>
	<template src="../common/main.html"></template>
</main>
<aside>
	<p>next file: component/index.html</p>
	<template src="phrase.html"></template>
	<p>next file: common/phrase.html</p>
	<template src="../common/phrase.html"></template>
</aside>
<template src="footer.html"></template>
```

html/common/head.html：

```html
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>{{ title }}</title>
</head>
<body>

{{if useHeader}}
	<template src="header.html"></template>
{{/if}}
```


其他文件略（参见 example 目录下的文件）。

注：模板语法参考[art-template模板引擎语法](https://aui.github.io/art-template/zh-cn/docs/syntax.html)。



配置参数如下：

 - `paths` 字符串或数组，定义跨目录查找的目录路径
 - `data` 模板渲染的初始数据
 - `beautify` HTML美化参数，传递给 `js-beautify` 插件






### 跨目录查找  ###

当模板中引入的子模板无法在当前目录及相对地址中查找到时，将从配置的 `paths` 目录中去查找（深遍历子目录）。文件索引的优先级是，当前目录最优，其后依次是 `paths` 中指定的目录。




### 模板数据 ###

模板中的数据共三种来源：

 1. 在 Gulp 中配置 `data` 项作为初始数据

 2. 在模板标签中配置属性，如

    ```html
    <template
    	useHeader
    	toBool="false"
    	toInt="2"
    	src="header.html"
    	title="Hello World"
    ></template>
    ```

    将得到数据如下：

    ```javascript
    {
    	useHeader: "useHeader",
    	toBool: false,
    	toInt: 2,
    	src: 'header.html',
    	title: 'hello world'
    }
    ```

    属性解析规则如下：
    ​	
     - `false` 和 `true` 被视为 Boolean 类型
     - 数字字符串被视为 Number 类型
     - 如果属性无值，则值为 String 类型的属性名

 3. 模板标签的内容，如：

    ```html
    <template src="header.html">
    {
    	"useHeader": true,
    	"toBool": false
    }
    </template>
    ```

    标签内的内容将由 `eval()` 解析。此外，`src` 必须写在标签属性中。

    或者，作如下定义：

    ```html
    <template src="header.html">
    	<fragment id="varname">
    		<a href="#">click here</a>
    	</fragment>
    </template>
    ```

    将得到：

    ```javascript
    {
    	varname: '<a href="#">click here</a>'
    }
    ```

    利用 `fragment` 可以很方便地传入 HTML 代码（提示：有的模板编译引擎有字符串转义功能，如果发现代码被转义，应当从模板引擎处查找问题。）

    注意，由于本页默认数据先于模板被处理，因此定义本页默认数据标签在模板中有类似于“作用域提升”的效果，即当前页面使用数据渲染的代码可以写在用标签定义数据代码之前

所有数据将层层传递，从初始数据到父模板，再到子模板，优先级是：标签内容数据 > 标签属性 > 继承数据 > 本页默认数据。



### HTML美化 ###

内置调用了 `js-beautify` 插件，对最后的结果进行美化。默认定义了如下参数：

	{
		indent_size: 4,
		indent_char: '\t',
		indent_with_tabs: true,
		preserve_newlines: true,
		max_preserve_newlines: 1
	}

可通过配置项 `beautify` 覆盖本插件的默认配置和添加其他可用配置。详情请见 `js-beautify` 插件。