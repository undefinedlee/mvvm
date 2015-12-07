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
	extend: extend
};