var util = require("./util");
// 核心指令
var CoreDirectives = {
	"for": require("./directives/for"),
	"if": require("./directives/if"),
	"else": require("./directives/else"),
	"switch": require("./directives/switch"),
	"case": require("./directives/case"),
	"model": require("./directives/model")
};
// 用户指令
var ClientDirectives = {};

module.exports = {
	// 获取所有指令
	get: function(){
		return util.extend(util.extend({}, CoreDirectives), ClientDirectives);
	},
	// 定义用户指令
	define: function(name, factory){
		ClientDirectives[name] = factory;
	}
};