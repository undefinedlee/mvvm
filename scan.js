function scan(dom){
	var scope = {};

	function parseAttr(attr){
		var name = attr.name;
		var value = attr.value;
		if(/\{\w+\}/.test(name)){}
	}

	function parse(dom){
		var children = dom.childNodes;
		var attrs = dom.attributes;

		var i, l
			child, nodeType;

		for(i = 0, l = attrs.length; i < l; i ++){
			parseAttr(attrs[i]);
		}
		
		for(i = 0, l = children.length, child, nodeType; i < l; i ++){
			child = children[i];
			nodeType = child.nodeType;
			switch(nodeType){
				// 标签节点
				case 1:
					break;
				// 文本节点
				case 3:
					break;
			}
		}
	}
}

module.exports = scan;