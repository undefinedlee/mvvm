var util = require("./util");

// 会产生子作用域的标签
var childScopeTag = "repeat if switch".toUpperCase().split(" ");
// 全局变量
var GlobalVar = ["Math Date Array Boolean Number String RegExp Function",
					"Infinity NaN undefined",
					"decodeURI encodeURI decodeURIComponent encodeURIComponent escape unescape eval parseInt parseFloat isFinite isNaN",
					"new typeof"].join(" ").split(" ");
var noop = function(){};
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
			return "{(" + expression + ")}";
		})
		.replace(/\}\{/g, "+")
		.replace(/^\{|\}$/g, "")
		.replace(/(^|\})([^{}]*)($|\{)/g, function(all, prefix, content, suffix){
			if(prefix === "}"){
				prefix = "+";
			}
			if(suffix === "{"){
				suffix = "+";
			}
			return prefix + "\"" + content.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n") + "\"" + suffix;
		});

		obj.parse = new Function("scope", "return " + content);
	}
	return obj;
}
/**
 * 扫描属性
 * mv-model mv-bind mv-style mv-class mv-show
 */
function scanAttr(node, watchs){
	var attrs = node.attributes;
	for(var i = 0, l = attrs.length; i < l; i ++){
		var name = attr.name;
		var value = attr.value;
		var expression = scanExpression(value);
	}
}
/**
 * 扫描节点
 */
function scanNode(node, watchs){
	var nodeType = node.nodeType;
	switch(nodeType){
		case 1:
			var tagName = node.tagName;
			if(childScopeTag.indexOf(tagName) === -1){
				var children = node.childNodes;
				for(var i = 0, l = children.length; i < l; i ++){
					scanNode(children[i], watchs);
				}
				scanAttr(node, watchs);
			}
			break;
		case 3:
			var nodeValue = node.nodeValue;
			var expression = scanExpression(nodeValue);
			var vars = expression.vars;
			var parse = expression.parse;
			for(var i = 0, l = vars.length, _var; i < l; i ++){
				var _var = vars[i];
				if(!watchs[_var]){
					watchs[_var] = [];
				}
				watchs[_var].push(function(scope){
					node.nodeValue = parse(scope);
				});
			}
			break;
	}
}
// 扫描节点
module.exports = function(node, watchs){
	watchs = watchs || {};
	scanNode(node, watchs);
	return watchs;
};