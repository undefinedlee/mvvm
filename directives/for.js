var scan = require("./scan");

module.exports = function(node){
	var exp = node.getAttribute("exp");
	var model = {};

	return {
		model: model,
		createNewScope: true
	};
};