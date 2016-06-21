(function ($, _, Backbone, app) {

idGenerator = 0;
//ids < 0 are reserved!
//Note: id = -1 means a new node.
newNodeID = -1;

function NodeNotFoundException(id, message) {
	this.id = id;
	this.message = "";

	if(message !== null) {
		this.message = message;
	}
}

app.models.LinkedListNode = Backbone.Model.extend({
	defaults: {
		elem: null,
		next: null,
		id : null,
		pointerCount : 0
	},

	initiailize: function (elem) {
		this.set('elem', elem);
		this.set('id', idGenerator);

		idGenerator = idGenerator + 1;
	}
});

app.models.LinkedList = Backbone.Model.extend({
	defaults: {
		front: null,
		rear: null,
	},
	initialize: function () {
		this.set('reachableNodes', new NodeCollection()); //node id -> node object
		this.set('unreachableNodes', new NodeCollection()); //node id -> node object
	},


	setPointer: function (srcNodeId, dstNodeId) {
		srcNode = getNode(srcNodeId);
		dstNode = getNode(dstNodeId);

		//did we find both the src and the dst node?
		if(srcNode === undefined || srcNode === undefined) {
			throw new NodeNotFoundException(srcNodeId);
		}
		else if(dstNode === undefined || dstNode === undefined) {
			throw new NodeNotFoundException(dstNodeId);
		}

		//is there anything for us to do?
		if(srcNode.next === dstNode)
			return; //nope

		//will changing pointers result in nodes becoming unreachable?
		//[hopefully this is quick enough procedure, otherwise I'll optimize
		//it]
		if(srcNode.next !== null) {
			updateNodeCollections(srcNode.next, dstNode);
		}

		//apply the requested change of pointers
		srcNode.next = dstNode;
	},


	getNode : function(id) {

		//new Node?
		if(id ==== newNodeID) {
			newNode = new LinkedListNode();
			this.get('reachableNodes').add(newNode);

			return newNode;
		}


		//is the requested node reachable?
		requestedNode = this.get('reachableNodes').get(id);

		if(requestedNode !== null && requestedNode !== undefined)
			return requestedNode;

		//maybe the requested node is an unreachable node?
		return this.get('unreachableNodes').get(id);
	},

	//Note: startNode is optional
	updateNodeCollections : function (startNode, stopNode) {
		newlyUnreachableNodes = sublist(startNode, stopNode);

		//remove these nodes from the reachable nodes list
		this.get('reachableNodes').remove(newlyUnreachableNodes);

		//add these guys to the unreachable collection
		this.get('unreachableNodes').add(newlyUnreachableNodes);
	},

	//both parameters are optional
	sublist : function(startNode, endNode) {
		//get out starting place
		start = getStartNode(startNode);
		end = getEndNode(endNode);

		currentNode = start;
		results = [];

		//Note: cycles are assumed to not be present for the purposes of this function
		while(currentNode !== null && currentNode.id !== end.id) {
			results.push(currentNode);
		}

		return results;
	}

	getStartNode : function(startNode) {
		if(startNode !== null && startNode !== undefined) {
			return startNode;
		}
		else {
			return this.get('front');
		}
	},

	getEndNode : function(endNode) {
		if(endNode !== null && endNode !== undefined) {
			return endNode;
		}
		else {
			return this.get('rear');
		}
	}


	initializeExample: function () {
		var node3 = new app.models.LinkedListNode({
			elem: 99,
			id: 2
		});
		var node2 = new app.models.LinkedListNode({
			elem: 42,
			next: node3,
			id: 1
		});
		var node1 = new app.models.LinkedListNode({
			elem: 24,
			next: node2,
			id: 0
		});

		var nodes = [];
		nodes.push(node1);
		nodes.push(node2);
		nodes.push(node3);

		this.get('reachableNodes').add(nodes);
		this.set('front', nodes[0]);
		this.set('rear', nodes[2]);
	}
});

var NodeCollection = Backbone.Collection.extend({
	model: LinkedListNode,

	initialize: function () {
		// When children on node change, update parent
		this.on('change:left change:right', function(node, child) {
			// If child node not removed
			if (child !== null) {
				child.set('parent', node);
			}
		});

}(jQuery, window._, window.Backbone, window.app));
