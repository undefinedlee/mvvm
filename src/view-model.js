var util = require("./util");
var scan = require("./scan");
var Scope = require("./scope");
var Directives = require("./directive").get();

var Undefined;

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
			if(!_parentScope.$hasProperty(key)){
				model[key] = Undefined;
			}
		});
		return model;
	})(watchs), model || {});
	// 生成ViewModel
	var vm = parentScope ? createNewScope ? parentScope.$new(model) : parentScope.$extend(model) : new Scope(model);
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
		if(directive.type === "Event"){
			// 注册事件
			var parse = new Function("scope", "$event", directive.content.replace(/[a-zA-Z\$_][a-zA-Z\$_0-9\.]*/g, function(expression){
				if(["$event"].indexOf(expression.split(".")[0]) === -1){
					return "scope." + expression;
				}
			}));
			directive.node.addEventListener(directive.name, function(e){
				parse.call(directive.node, vm, e);
			}, false);
		}else{
			var result = Directives[directive.name](directive, vm);
			if(directive.type === "Tag"){
				result.children.forEach(function(child){
					ViewModel(child.node, child.model, vm, result.createNewScope);
				});
			}
		}
	});

	return vm;
};

module.exports = ViewModel;
