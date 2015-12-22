var model = VM.vm(document.getElementById("test1"), {
	c: 2
});

//model.e = 5;

var vm2 = VM.vm(document.getElementById("test2"));
vm2.a="a";
vm2.b="c";