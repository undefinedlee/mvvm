var scan = require("../scan");

module.exports = function(directive){
	var model = {};

	return {
		model: model,
		createNewScope: false
	};
};