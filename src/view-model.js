var util = require("./util");
var scan = require("./scan");
var Scope = require("./scope");
var Directives = require("./directive").get();

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
