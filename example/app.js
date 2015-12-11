var Scope = require("scope");
var ViewModel = require("view-model");

var scope = new Scope({
	a: 1,
	b: 1,
	c: 1
});

var model = ViewModel(document.getElementById("test1"), {
	c: 2
}, scope);

//model.e = 5;

var vm2 = ViewModel(document.getElementById("test2"));
vm2.a="a";
vm2.b="c";