var util = require("./util");

function trans(vm, model){
	Object.defineProperties(vm, (function(model){
		var _model = {};
		Object.keys(model).forEach(function(key){
			function accessor(value){
				if(value !== accessor.$value){
					accessor.$value = value;
					vm.$digest(key);
				}
			}
			_model[key] = {
				get: function(){
					return accessor.$value;
				},
				set: accessor
			};
		});
		return _model;
	})(model));
}

function Scope(propertys){
	trans(this, propertys);
}
Scope.prototype = {
	$new: function(propertys){
		function Scope(){}
		Scope.prototype = this;
		Scope.constructor = Scope;

		var scope = new Scope();
		scope.$watchs = {};

		trans(scope, propertys);

		return scope;
	},
	$watchs: {},
	$watch: function(property, fn){
		if(this.$watchs[property]){
			this.$watchs[property].push(fn);
		}else{
			this.$watchs[property] = [fn];
		}
	},
	$digest: function(property){
		var scope;
		if(this.$watchs[property]){
			scope = this;
			this.$watchs[property].forEach(function(watch){
				watch(scope);
			});
		}
	}
};

module.exports = Scope;