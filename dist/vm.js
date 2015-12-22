;(function(main){
	window["VM"] = main;
})((function(){
	var mods = {};
	function require(id){
		return mods[id];
	}
	function define(id, factory){
		var module = {exports: {}};
		factory(require, module.exports, module);
		mods[id] = module.exports;
	}
	
	// util
	define("3", function(require, exports, module){
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

	// scan
	define("9", function(require, exports, module){
		var util = require("3");
		
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
	});

	// directives/for
	define("4", function(require, exports, module){
		var scan = require("9");
		
		module.exports = function(node){
			var exp = node.getAttribute("exp");
			var model = {};
		
			return {
				model: model,
				createNewScope: true
			};
		};
	});

	// directives/if
	define("5", function(require, exports, module){
		var scan = require("9");
		
		module.exports = function(node){
			var exp = node.getAttribute("exp");
			var model = {};
		
			return {
				model: model,
				createNewScope: false
			};
		};
	});

	// directives/else
	define("6", function(require, exports, module){
		var scan = require("9");
		
		module.exports = function(node){
			var exp = node.getAttribute("exp");
			var model = {};
		
			return {
				model: model,
				createNewScope: false
			};
		};
	});

	// directives/switch
	define("7", function(require, exports, module){
		var scan = require("9");
		
		module.exports = function(node){
			var exp = node.getAttribute("exp");
			var model = {};
		
			return {
				model: model,
				createNewScope: false
			};
		};
	});

	// directives/case
	define("8", function(require, exports, module){
		var scan = require("9");
		
		module.exports = function(node){
			var exp = node.getAttribute("exp");
			var model = {};
		
			return {
				model: model,
				createNewScope: false
			};
		};
	});

	// directive
	define("1", function(require, exports, module){
		var util = require("3");
		// 核心指令
		var CoreDirectives = {
			"for": require("4"),
			"if": require("5"),
			"else": require("6"),
			"switch": require("7"),
			"case": require("8")
		};
		// 用户指令
		var ClientDirectives = {};
		
		module.exports = {
			// 获取所有指令
			get: function(){
				return util.extend(util.extend({}, CoreDirectives), ClientDirectives);
			},
			// 定义用户指令
			define: function(name, factory){
				ClientDirectives[name] = factory;
			}
		};
	});

	// scope
	define("A", function(require, exports, module){
		var util = require("3");
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
						enumerable: true,
						configurable: true
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
					value: [],
					configurable: true
				},
				// 监听列表
				$listeners: {
					value: {},
					configurable: true
				},
				// 事件监听列表
				$eventListeners: {
					value: {},
					configurable: true
				}
			});
		
			// 关闭对象添加、删除属性
			//Object.seal(this);
		}
		Scope.prototype = {
			// 扩展属性
			$extend: function(propertys){
				var self = this;
				trans(this, propertys, function(property){
					self.$digest(property);
				});
			},
			// 创建子作用域
			$new: function(propertys){
				var scope = Object.create(this);
				this.$children.push(scope);
				Object.defineProperties(scope, {
					// 父作用域
					$parent: {
						value: this,
						configurable: true
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
				// 触发销毁事件
				this.$fire("$destroy");
				// 销毁所有属性
				var self = this;
				Object.keys(this).concat(["$parent", "$children", "$listeners", "$eventListeners"]).forEach(function(key){
					delete self[key];
				});
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

	// view-model
	define("2", function(require, exports, module){
		var util = require("3");
		var scan = require("9");
		var Scope = require("A");
		var Directives = require("1").get();
		
		var Undefined;
		// 检测某个作用域是否包含某个属性
		function hasProperty(scope, property){
			if(scope.hasOwnProperty(property)){
				return true;
			}else if(scope.$parent){
				return hasProperty(scope.$parent, property);
			}
			return false;
		}
		
		var ViewModel = function(node, model, parentScope, createNewScope){
			// 扫描节点
			var result = scan(node);
			// 扫描结果中的绑定点
			var watchs = result.watchs;
			// 扫描结果中的指令
			var directives = result.directives;
			// 提取模板中watch的属性
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
			// 生成ViewModel
			var vm = parentScope ? createNewScope ? parentScope.$new(model) : parentScope : new Scope(model);
			// 绑定watch
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
			// 解析指令
			directives.forEach(function(directive){
				var result = Directives[directive.name](directive.node);
				ViewModel(directive.node, result.model, vm, result.createNewScope);
			});
		
			return vm;
		};
		
		module.exports = ViewModel;
		
	});

	// index.js
	define("0", function(require, exports, module){
		var Directive = require("1");
		var ViewModel = require("2");
		
		module.exports = {
			directive: Directive.define,
			vm: ViewModel
		};
	});

	return require("0");
})());