var util = require("../util");

module.exports = function(directive, vm){
	var type;

	switch(directive.node.tagName){
		case "INPUT":
			switch(directive.node.type){
				case "text":
				case "password":
				case "hidden":
					type = "text";
					break;
				case "checkbox":
					type = "checkbox";
					break;
				case "radio":
					type = "radio";
					break;
			}
			break;
		case "TEXTAREA":
			type = "text";
			break;
		case "SELECT":
			type = "select";
			break;
		default:
			type = "label";
	}

	vm.$watch(directive.content, function(){
		var value = util.getPropertyValue(vm, directive.content);
		switch(type){
			case "text":
				directive.node.value = value;
				break;
		}
	});

	switch(type){
		case "text":
			directive.node.addEventListener("keyup", function(){
				util.setPropertyValue(vm, directive.content, directive.node.value);
			}, false);
			break;
	}
};