function extend(target, src){
	if(src){
		for(var key in src){
			if(src.hasOwnProperty(key)){
				target[key] = src[key];
			}
		}
	}
	return target;
}

module.exports = {
	extend: extend,
	packString: function(str){
		return str.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n");
	},
	getPropertyValue: function(obj, property){
		property = property.split(".");

		while(property.length && obj){
			obj = obj[property.shift()];
		}

		return obj;
	},
	setPropertyValue: function(obj, property, value){
		var property = property.split(".");
		var _property = property.pop();

		while(property.length && obj){
			obj = obj[property.shift()];
		}

		if(obj){
			obj[_property] = value;
		}
	}
};