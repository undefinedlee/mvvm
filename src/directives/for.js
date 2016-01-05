var scan = require("../scan");
var util = require("../util");

var Undefined;

var cacheContainer = document.createDocumentFragment();

module.exports = function(directive, vm){
	var children = [];

	var expression = directive.content.match(/^([a-zA-Z\$_][a-zA-Z\$_0-9]*)\s+in\s+([a-zA-Z\$_][a-zA-Z\$_0-9\.]*)$/);
	if(expression){
		var placeholder = document.createComment("for placeholder");
		directive.node.parentNode.insertBefore(placeholder, directive.node);
		var template = cacheContainer.appendChild(directive.node);

		var list = [];

		function clone(model){
			var item = template.cloneNode();
			list.push(item);
			placeholder.parentNode.insertBefore(item, placeholder);
			children.push({
				node: item,
				model: model
			});
		}

		function render(scope){
			var value = util.getPropertyValue(scope, expression[1]) || [];
			if(value instanceof Array){
				for(var i = 0, l = value.length; i < l; i ++){
					var model = {
						$key: i
					};
					model[expression[0]] = value[i];
					clone(model);
				}
			}else if(typeof value === "number"){
				for(var i = 0; i < value; i ++){
					var model = {
						$key: i
					};
					model[expression[0]] = i;
					clone(model);
				}
			}else{
				for(var key in value){
					var model = {
						$key: key
					};
					model[expression[0]] = value[key];
					clone(model);
				}
			}
		}

		vm.$watch(expression[1], render);
		render(vm);
	}else{
		console.error("error expression '" + directive.content + "' for directive 'for'");
	}

	return {
		children: children,
		createNewScope: true
	};
};