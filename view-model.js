var util = require("./util");
var scan = require("./scan");
var Scope = require("./scope");
var repeat = require("./repeat");

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

var ViewModel = function(node, model, parentScope){
	var result = scan(node);
	var watchs = result.watchs;
	var children = result.children;
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
	var vm = parentScope ? parentScope.$new(model) : new Scope(model);
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

	children.forEach(function(child){
		switch(child.tagName){
			case "repeat":
				var result = repeat(node);
				ViewModel(result.nodes, result.model, vm);
				break;
		}
	});

	return vm;
};

module.exports = function(node, model, parentScope){};
