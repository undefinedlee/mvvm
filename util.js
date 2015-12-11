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
	}
};