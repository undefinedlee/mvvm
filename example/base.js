var mods = {};
function require(id){
	return mods[id.replace(/\.\//, "")];
}
function define(id, factory){
	var module = {
		exports: {}
	};
	factory(module, module.exports);
	mods[id] = module.exports;
}

// define("util", function(module, exports){});
// define("scope", function(module, exports){});
// define("scan", function(module, exports){});
// define("view-model", function(module, exports){});




define("util", function(module, exports){
function extend(target, src){
	if(src){
		for(var key in src){
			if(src.hasOwnProperty(key)){
				target[key] = src[key];
			}
		}
	}
	return target;
}

module.exports = {
	extend: extend,
	packString: function(str){
		return str.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n");
	}
};
});




define("scope", function(module, exports){
var util = require("./util");
// 
function isObject(opt){
	return opt && opt.toString() === "[object Object]" && !(opt instanceof Array);
}
// 使用get/set包装model
function trans(vm, model, onchange){
	model = model || vm;
	Object.defineProperties(vm, (function(model){
		var _model = {};
		Object.keys(model).forEach(function(key){
			// 检测对象属性
			function objectProperty(property){
				if(isObject(property)){
					trans(property, null, function(property){
						onchange(key + "." + property);
					});
				}
			}
			// 存取器
			function accessor(value){
				if(value !== accessor.$value){
					accessor.$value = value;
					objectProperty(value);
					onchange(key);
				}
			}
			// 默认值
			accessor.$value = model[key];
			objectProperty(accessor.$value);

			_model[key] = {
				get: function(){
					return accessor.$value;
				},
				set: accessor,
				enumerable: true
			};
		});
		return _model;
	})(model));
}

var noReady = true;
// 待处理列表
var readyDigestList = [];
// 处理渲染
function digest(){
	readyDigestList.forEach(function(digest){
		digest(digest.scope);
	});
	readyDigestList = [];
	noReady = true;
}

function Scope(propertys){
	var self = this;
	trans(this, propertys, function(property){
		self.$digest(property);
	});
	Object.defineProperties(this, {
		// 子作用域
		$children: {
			value: []
		},
		// 监听列表
		$listeners: {
			value: {}
		},
		// 事件监听列表
		$eventListeners: {
			value: {}
		}
	});

	// 关闭对象添加、删除属性
	Object.seal(this);
}
Scope.prototype = {
	// 创建子作用域
	$new: function(propertys){
		var scope = Object.create(this);
		this.$children.push(scope);
		Object.defineProperties(scope, {
			// 父作用域
			$parent: {
				value: this
			}
		});
		Scope.call(scope, propertys);
		return scope;
	},
	// 监听属性
	$watch: function(property, listener){
		if(this.$listeners[property]){
			this.$listeners[property].push(listener);
		}else{
			this.$listeners[property] = [listener];
		}
	},
	// 触发监听
	$digest: function(property){
		var scope;
		if(this.$listeners[property]){
			scope = this;
			this.$listeners[property].forEach(function(listener){
				if(readyDigestList.indexOf(listener) === -1){
					// 加入待处理列表
					listener.scope = scope;
					readyDigestList.push(listener);
		
					if(noReady){
						noReady = false;
						requestAnimationFrame(digest);
					}
				}
			});
		}
		// 属性
		var mainProperty = property.split(".")[0];
		// 触发子作用域的监听
		this.$children.forEach(function(child){
			if(!child.hasOwnProperty(mainProperty)){
				child.$digest(property);
			}
		});
	},
	// 销毁作用域
	$destroy: function(){
		if(this.$parent){
			// 从父作用域移除自己
			this.$parent.$children.splice(this.$parent.$children.indexOf(this), 1);
		}
		// 移除所有子作用域
		this.$children.forEach(function(child){
			child.$destroy();
		});
		this.$children = null;
		this.$listeners = null;
		this.$fire("$destroy");
		this.$eventListeners = null;
	},
	$on: function(eventName, listener){
		if(this.$eventListeners[eventName]){
			this.$eventListeners[eventName].push(listener);
		}else{
			this.$eventListeners[eventName] = [listener];
		}
	},
	$fire: function(eventName){
		var self;
		if(this.$eventListeners[eventName]){
			self = this;
			this.$eventListeners[eventName].forEach(function(listener){
				listener.call(self);
			});
		}
	}
};

module.exports = Scope;
});




define("scan", function(module, exports){
var util = require("./util");

// 会产生子作用域的标签
var childScopeTag = "repeat if switch".toUpperCase().split(" ");
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
 * mv-model mv-bind mv-style mv-class mv-show
 */
function scanAttr(node, watchs){
	var attrs = node.attributes;
	for(var i = 0, l = attrs.length, attr; i < l; i ++){
		attr = attrs[i];
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
			break;
	}
}
// 扫描节点
module.exports = function(node, watchs){
	watchs = watchs || {};
	scanNode(node, watchs);
	return watchs;
};
});




define("view-model", function(module, exports){
var util = require("./util");
var scan = require("./scan");
var Scope = require("./scope");

var Undefined;

function hasProperty(scope, property){
	if(scope.hasOwnProperty(property)){
		return true;
	}else if(scope.$parent){
		return hasProperty(scope.$parent, property);
	}
	return false;
}

module.exports = function(node, model, parentScope){
	var watchs = scan(node);

	model = util.extend((function(watchs){
		var model = {};
		var _parentScope = parentScope || {};
		Object.keys(watchs).forEach(function(key){
			key = key.split(".")[0];
			if(!hasProperty(_parentScope, key)){
				model[key] = Undefined;
			}
		});
		return model;
	})(watchs), model || {});

	var vm = parentScope ? parentScope.$new(model) : new Scope(model);

	for(var key in watchs){
		if(vm.$listeners[key]){
			vm.$listeners[key] = vm.$listeners[key].concat(watchs[key]);
		}else{
			vm.$listeners[key] = watchs[key];
		}
		// 初始化时渲染
		vm.$digest(key);
	}
	// 作用域销毁时销毁dom节点
	vm.$on("$destroy", function(){
		node.parentNode.removeChild(node);
	});

	return vm;
};
});