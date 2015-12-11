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