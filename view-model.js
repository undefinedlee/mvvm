var scan = require("./scan");
var Scope = require("./scope");

module.exports = function(node, model, parentScope){
	var vm = parentScope ? parentScope.$new(model) : new Scope(model);
	var watchs = scan(node);

	for(var key in watchs){
		if(vm.$watchs[key]){
			vm.$watchs[key] = vm.$watchs[key].concat(watchs[key]);
		}else{
			vm.$watchs[key] = watchs[key];
		}
	}

	return vm;
};