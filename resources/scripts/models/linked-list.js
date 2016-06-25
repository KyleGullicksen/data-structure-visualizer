(function ($, _, Backbone, app) {

var idGenerator = 1;

var constants = {

	//Note: ids <= 0 are reserved
	ids: {
		nil: -1,
		newNode: 0
	}
};



function NodeNotFoundException(id, message) {
	this.id = id;
	this.message = '';

	if (message !== null) {
		this.message = message;
	}
}

function Assignment(srcNode, dstNode, isFront, isRear) {
	this.srcNode = srcNode;
	this.dstNode = dstNode;
	this.isFront = isFront;
	this.isRear = isRear;
}

app.models.LinkedListNode = Backbone.Model.extend({
	defaults: {
		next: null,
		elem: null,
		id : null
	},

	initiailize: function (elem) {
		this.set('elem', elem);
		this.set('id', idGenerator);

		idGenerator = idGenerator + 1;
	}
});

var NodeCollection = Backbone.Collection.extend({
	model: app.models.LinkedListNode
});

app.models.LinkedList = Backbone.Model.extend({
	defaults: {
		front: null,
		rear: null,
		p: null
	},
	initialize: function () {
		this.set('nodes', new NodeCollection());
	},


	setPointer: function (srcPointerId, dstNodeId) {

		if (srcPointerId === dstNodeId) {
			return;
		}

		var dstNode = this.getDstNode(dstNodeId);

		if (srcPointerId.indexOf('-next') !== -1) {
			var node = this.get(srcPointerId.replace('-next', ''));
			if (node) {
				node.set('next', dstNode);
			}
		} else {
			this.set(srcPointerId, dstNode);
		}

		//did we just introduce a cycle?
		if (this.cycleDetected()) {
			window.alert('Say NO to cycles!');
			throw 'Gah, no cycles! WHY YOU DO THIS??'; //yes, this is a debug message =)
		}
	},


	getDstNode: function(dstNodeId) {

		if (dstNodeId === 'null') {
			return null;
		} else if (dstNodeId === 'new-node') {
			return new app.models.LinkedListNode({
				elem: window.prompt('Enter a new value for this node')
			});
		} else {
			// Handle case where Front, Rear, P, or *->Next is set as dst
			if (dstNodeId.indexOf('-next') !== -1) {
				var node = this.get(dstNodeId.replace('-next', ''));
				if (node) {
					return node.get('next');
				} else {
					return null;
				}
			} else {
				return this.get(dstNodeId);
			}
		}

	},

	//Super simple implementation. This'll be as fast as a optimal solution, but it'll
	///use up a wee bit of memory, whereas optimal solutions won't.
	//If memory becomes an issue, I can transition to a fancy version. But for now, I believe the
	//ease of understanding this algorithm outweights the fact that I'll use a wee bit of memory.
	cycleDetected: function() {
		var nodesWeHaveSeen = {};
		var currentNode = this.get('front');

		while (currentNode !== null) {
			if (nodesWeHaveSeen.hasOwnProperty(currentNode.get('id'))) {
				return true;
			}

			nodesWeHaveSeen[currentNode.get('id')] = true;
			currentNode = currentNode.get('next');
		}

		return false;
	},

	forEachReachable: function(callback) {
		var front = this.get('front');
		var rear = this.get('rear');
		var p = this.get('p');
		var currentNode = front;

		while (currentNode !== null) {
			callback(currentNode, front, rear, p);
			currentNode = currentNode.get('next');
		}
	},

	//If performance becomes an issue, we can use caching to speed this method up.

	forEachUnreachable: function(callback) {
		var front = this.get('front');
		var rear = this.get('rear');
		var p = this.get('p');
		var currentNode = front;
		var seenNodes = {};

		while (currentNode !== null) {
			seenNodes[currentNode.get('id')] = true;
			currentNode = currentNode.get('next');
		}

		var index = 0;

		while (index < this.get('nodes').length) {
			currentNode = this.get('nodes').at(index);

			if (!seenNodes.hasOwnProperty(currentNode.get('id'))) {
				callback(currentNode, front, rear, p);
			}

			index = index + 1;
		}
	},

	// Return the ID of the given node (or null of node is null)
	getNodeId: function (node) {
		if (node === null) {
			return null;
		} else {
			return node.get('id');
		}
	},

	// Return a serialized object representing the state of the list
	getState: function () {
		var state = {
			front: this.getNodeId(this.get('front')),
			rear: this.getNodeId(this.get('rear')),
			p: this.getNodeId(this.get('p')),
			nodes: []
		};
		var nodes = this.get('nodes');
		var view = this;
		nodes.forEach(function (node) {
			state.nodes.push({
				id: node.get('id'),
				elem: node.get('elem'),
				next: view.getNodeId(node.get('next'))
			});
		});
		return state;
	},

	setState: function (state) {
		var nodes = this.get('nodes');
		// Empty the node collection before pushing new nodes
		nodes.reset([]);
		var view = this;
		// Initially add all nodes with their IDs and element values
		state.nodes.forEach(function (nodeState) {
			var node = new app.models.LinkedListNode({
				id: nodeState.id,
				elem: nodeState.elem,
				// Use ID of next node; convert to pointer in next loop
				next: nodeState.next
			});
			if (nodeState.id === state.front) {
				view.set('front', node);
			}
			if (nodeState.id === state.rear) {
				view.set('rear', node);
			}
			if (nodeState.id === state.p) {
				view.set('p', node);
			}
			nodes.add(node);
		});
		// Now that all nodes exist, convert next IDs to next pointers
		nodes.forEach(function (node) {
			var nextId = node.get('next');
			if (nextId !== null) {
				node.set('next', nodes.get(nextId));
			}
		});
	},

	initializeExample: function () {
		var node4 = new app.models.LinkedListNode({
			elem: 51,
			id: 3
		});
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

		var nodes = new NodeCollection();
		nodes.add(node1);
		nodes.add(node2);
		nodes.add(node3);
		nodes.add(node4);

		this.set('nodes', nodes);
		this.set('front', node1);
		this.set('rear', node3);
		this.set('p', node4);
	}
});

}(jQuery, window._, window.Backbone, window.app));
