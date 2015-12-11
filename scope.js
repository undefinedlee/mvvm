var util = require("./util");
// 
function isObject(opt){
	return opt && opt.toString() === "[object Object]" && !(opt instanceof Array);
}
// 使用get/set包装model
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

var noReady = true;
// 待处理列表
var readyDigestList = [];
// 处理渲染
function digest(){
	readyDigestList.forEach(function(digest){
		digest(digest.scope);
	});
	readyDigestList = [];
	noReady = true;
}

function Scope(propertys){
	var self = this;
	trans(this, propertys, function(property){
		self.$digest(property);
	});
	Object.defineProperties(this, {
		// 子作用域
		$children: {
			value: []
		},
		// 监听列表
		$listeners: {
			value: {}
		},
		// 事件监听列表
		$eventListeners: {
			value: {}
		}
	});

	// 关闭对象添加、删除属性
	Object.seal(this);
}
Scope.prototype = {
	// 创建子作用域
	$new: function(propertys){
		var scope = Object.create(this);
		this.$children.push(scope);
		Object.defineProperties(scope, {
			// 父作用域
			$parent: {
				value: this
			}
		});
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
		var scope;
		if(this.$listeners[property]){
			scope = this;
			this.$listeners[property].forEach(function(listener){
				if(readyDigestList.indexOf(listener) === -1){
					// 加入待处理列表
					listener.scope = scope;
					readyDigestList.push(listener);
		
					if(noReady){
						noReady = false;
						requestAnimationFrame(digest);
					}
				}
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
		}
		// 移除所有子作用域
		this.$children.forEach(function(child){
			child.$destroy();
		});
		this.$children = null;
		this.$listeners = null;
		this.$fire("$destroy");
		this.$eventListeners = null;
	},
	$on: function(eventName, listener){
		if(this.$eventListeners[eventName]){
			this.$eventListeners[eventName].push(listener);
		}else{
			this.$eventListeners[eventName] = [listener];
		}
	},
	$fire: function(eventName){
		var self;
		if(this.$eventListeners[eventName]){
			self = this;
			this.$eventListeners[eventName].forEach(function(listener){
				listener.call(self);
			});
		}
	}
};

module.exports = Scope;