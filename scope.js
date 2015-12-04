var util = require("./util");

function Scope(propertys){
	util.extend(this, propertys);
}
Scope.prototype = {
	$extend: function(propertys){
		function Scope(){}
		Scope.prototype = this;
		Scope.constructor = Scope;

		return util.extend(new Scope(), propertys);
	}
};

module.exports = Scope;