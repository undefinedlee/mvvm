var util = require("./util");

function isObject(opt){
	return opt && opt.toString() === "[object Object]" && !(opt instanceof Array);
}

function trans(vm, model, onchange){
	model = model || vm;
	Object.defineProperties(vm, (function(model){
		var _model = {};
		Object.keys(model).forEach(function(key){
			// 检测对象属性
			function objectProperty(property){
				if(isObject(property)){
					trans(property, null, function(property){
						onchange(key + "." + property);
					});
				}
			}
			// 存取器
			function accessor(value){
				if(value !== accessor.$value){
					accessor.$value = value;
					objectProperty(value);
					onchange(key);
				}
			}
			// 默认值
			accessor.$value = model[key];
			objectProperty(accessor.$value);

			_model[key] = {
				get: function(){
					return accessor.$value;
				},
				set: accessor,
				enumerable: true
			};
		});
		return _model;
	})(model));
}

function Scope(propertys){
	var self = this;
	trans(this, propertys, function(property){
		self.$digest(property);
	});
	// 子作用域
	this.$children = [];
	// 监听列表
	this.$listeners = {};
	// 关闭对象添加、删除属性
	Object.seal(this);
}
Scope.prototype = {
	// 创建子作用域
	$new: function(propertys){
		var scope = Object.create(this);
		this.$children.push(scope);
		scope.$parent = this;
		Scope.call(scope, propertys);
		return scope;
	},
	// 监听属性
	$watch: function(property, listener){
		if(this.$listeners[property]){
			this.$listeners[property].push(listener);
		}else{
			this.$listeners[property] = [listener];
		}
	},
	// 触发监听
	$digest: function(property){
		var self;
		if(this.$listeners[property]){
			self = this;
			this.$listeners[property].forEach(function(listener){
				listener(self);
			});
		}
		// 属性
		var mainProperty = property.split(".")[0];
		// 触发子作用域的监听
		this.$children.forEach(function(child){
			if(!child.hasOwnProperty(mainProperty)){
				child.$digest(property);
			}
		});
	},
	// 销毁作用域
	$destroy: function(){
		if(this.$parent){
			// 从父作用域移除自己
			this.$parent.$children.splice(this.$parent.$children.indexOf(this), 1);
			// 移除所有子作用域
			this.$children.forEach(function(child){
				child.$destroy();
			});
		}
	}
};

module.exports = Scope;