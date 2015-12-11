var Scope = require("scope");
var ViewModel = require("view-model");

var scope = new Scope({
	a: 1,
	b: 1,
	c: 1
});

var model = ViewModel(document.getElementsByTagName("div")[0], {
	c: 2,
	d: 2,
	e: 2
}, scope);

scope.b = 3;