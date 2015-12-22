var util = require("./util");

// 标准标签
var standardTag = ["a abbr acronym address area article aside audio",
					"b base bdi bdo big blockquote body br button",
					"canvas caption cite code col colgroup command",
					"datalist dd del details div dfn dialog dl dt",
					"em embed",
					"fieldset figcaption figure footer form frame frameset",
					"h1 h2 h3 h4 h5 h6 head header hr html",
					"i iframe img input ins",
					"kbd keygen",
					"label legend li link",
					"map mark menu menuitem meta meter",
					"nav noframes noscript",
					"object ol optgroup option output",
					"p param pre progress",
					"q",
					"rp rt ruby",
					"samp script section select small source span strong style sub summary sup",
					"table tbody td textarea tfoot th thead time title tr track tt",
					"ul",
					"var video",
					"wbr"].join(" ").split(" ");
// 全局变量
var GlobalVar = ["Math Date Array Boolean Number String RegExp Function",
					"Infinity NaN undefined",
					"decodeURI encodeURI decodeURIComponent encodeURIComponent escape unescape eval parseInt parseFloat isFinite isNaN",
					"new typeof"].join(" ").split(" ");
var noop = function(){};
// 渲染时的工具方法
var renderUtil = {
	toString: function(value){
		if(value === null || typeof value === "undefined"){
			return "";
		}
		return value;
	}
};
/**
 * 扫描表达式
 * {var}
 */
function scanExpression(content){
	var vars = [];
	var obj = {
		vars: vars,
		parse: noop
	};
	// 有表达式
	if(/\{[^{}]+\}/.test(content)){
		content = content.replace(/\{([^{}]+)\}/g, function(all, expression){
			expression = expression.replace(/(["']?)[a-zA-Z\$_][a-zA-Z\$_0-9\.]*\1/g, function(expression, quot){
				if(!quot && GlobalVar.indexOf(expression.split(".")[0]) === -1){
					vars.push(expression);
					return "scope." + expression;
				}
				return expression;
			});
			return "{util.toString(" + expression + ")}";
		})
		.replace(/\}\{/g, "+")
		.replace(/^\{|\}$/g, "");

		if(/{|}/.test(content)){
			content = content.replace(/(^|\})([^{}]*)($|\{)/g, function(all, prefix, content, suffix){
				if(prefix === "}"){
					prefix = "+";
				}
				if(suffix === "{"){
					suffix = "+";
				}
				return prefix + "\"" + util.packString(content) + "\"" + suffix;
			});
		}else{
			content = util.packString(content);
		}

		obj.parse = new Function("scope", "util", "return " + content);
	}
	return obj;
}
/**
 * 扫描属性
 * mv-model
 * mv-text
 * mv-html
 * mv-style
 * mv-src
 */
function scanAttr(node, watchs){
	var attrs = node.attributes;
	for(var i = 0, l = attrs.length, attr; i < l; i ++){
		attr = attrs[i];
		var name = attr.name;
		var value = attr.value;
		var expression = scanExpression(value);
		var vars = expression.vars;
		if(vars.length){
			var parse = (function(parse){
				if(/^mv\-/.test(name)){
					name = name.replace(/^mv\-/, "");
					switch(name){
						case "text":
							return function(scope){
								node.innerText = parse(scope, renderUtil);
							};
							break;
						case "html":
							return function(scope){
								node.innerHTML = parse(scope, renderUtil);
							};
							break;
						case "style":
							return function(scope){
								node.style.cssText = parse(scope, renderUtil);
							};
							break;
						case "src":
							return function(scope){
								node.src = parse(scope, renderUtil);
							};
							break;
					}
				}else{
					return function(scope){
						attr.value = parse(scope, renderUtil);
					};
				}
				return noop;
			})(expression.parse);

			for(var _i = 0, _l = vars.length, _var; _i < _l; _i ++){
				_var = vars[_i];
				if(watchs[_var]){
					watchs[_var].push(parse);
				}else{
					watchs[_var] = [parse];
				}
			}
		}
	}
}
/**
 * 扫描节点
 */
function scanNode(node, watchs, directives, isRoot){
	var nodeType = node.nodeType;
	switch(nodeType){
		case 1:
			var tagName = node.tagName.toLowerCase();
			if(standardTag.indexOf(tagName) !== -1 || isRoot){
				var children = node.childNodes;
				for(var i = 0, l = children.length; i < l; i ++){
					scanNode(children[i], watchs, directives, false);
				}
				scanAttr(node, watchs);
			}else{
				directives.push({
					name: tagName,
					node: node
				});
			}
			break;
		case 3:
			var nodeValue = node.nodeValue;
			var expression = scanExpression(nodeValue);
			var vars = expression.vars;
			if(vars.length){
				var parse = (function(parse){
					return function(scope){
						node.nodeValue = parse(scope, renderUtil);
					};
				})(expression.parse);

				for(var i = 0, l = vars.length, _var; i < l; i ++){
					_var = vars[i];
					if(watchs[_var]){
						watchs[_var].push(parse);
					}else{
						watchs[_var] = [parse];
					}
				}
			}
			break;
	}
}
// 扫描节点
module.exports = function(node, watchs, directives){
	watchs = watchs || {};
	directives = directives || [];
	scanNode(node, watchs, directives, true);
	return {
		watchs: watchs,
		directives: directives
	};
};