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
		extend: extend
	};
});




define("scope", function(module, exports){
	var util = require("./util");

	function isObject(opt){
		return opt && opt.toString() === "[object Object]" && !(opt instanceof Array);
	}

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

	function Scope(propertys){
		var self = this;
		trans(this, propertys, function(property){
			self.$digest(property);
		});
		// 子作用域
		this.$children = [];
		// 监听列表
		this.$listeners = {};
		// 关闭对象添加、删除属性
		Object.seal(this);
	}
	Scope.prototype = {
		// 创建子作用域
		$new: function(propertys){
			var scope = Object.create(this);
			this.$children.push(scope);
			scope.$parent = this;
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
			var self;
			if(this.$listeners[property]){
				self = this;
				this.$listeners[property].forEach(function(listener){
					listener(self);
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
				// 移除所有子作用域
				this.$children.forEach(function(child){
					child.$destroy();
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
});




define("view-model", function(module, exports){
	var scan = require("./scan");
	var Scope = require("./scope");

	module.exports = function(node, model, parentScope){
		var vm = parentScope ? parentScope.$new(model) : new Scope(model);
		var watchs = scan(node);

		for(var key in watchs){
			if(vm.$listeners[key]){
				vm.$listeners[key] = vm.$listeners[key].concat(watchs[key]);
			}else{
				vm.$listeners[key] = watchs[key];
			}
		}

		return vm;
	};
});