(function () {

// The controller view which watches for interaction with UI controls and
// updates models/views according to values changed
app.views.Controller = Backbone.View.extend({
	appInitialized: false,
	events: {
		'change .data-structure-options': 'switchStructure',
		'click .execute': 'executeAction',
		'click .reset': 'resetStructure',
		'change .action-options': 'changeAction',
		'click .undo': 'undoAction',
		'click .recenter': 'recenterCanvas'
	},

	initialize: function () {
		this.setMenuOptions('.data-structure-options',
			app.views.Controller.structureList);
		this.restoreAppState();
	},
	restoreAppState: function () {
		var appStateStr = localStorage.getItem(this.constructor.storageKey);
		if (appStateStr !== null) {
			var appState = JSON.parse(appStateStr);
			this.structureStateStack = appState.structureStateStack;
			this.setStructure(
				appState.controls['data-structure-options'],
				appState.currentStructureState);
			this.restoreControlValues(appState.controls);
		} else {
			this.structureStateStack = [];
			this.setStructure(this.constructor.defaultStructure);
		}
	},
	restoreControlValues: function (controls) {
		this.$el.children('select').each(function () {
			var $select = $(this);
			$select.val(controls[$select.prop('class')]);
		});
	},
	setStructure: function (structureName, structureState) {
		// Variables pointing to constructors
		var StructureModel = app.models[structureName];
		var StructureView = app.views[structureName];
		// Variables pointing to instances of the above constructors
		this.structureModel = new StructureModel();
		if (structureState) {
			this.structureModel.setState(structureState);
		} else {
			this.structureModel.reset();
		}
		this.structureView = new StructureView({
			el: $('#canvas-container')[0],
			model: this.structureModel
		});
		this.structureView.render();
		// Update dropdown menus with values specific to chosen data structure
		this.setMenuOptions('.src-pointer-options', StructureView.srcPointerOptions);
		this.setMenuOptions('.dst-node-options', StructureView.dstNodeOptions);
	},
	switchStructure: function (event) {
		this.structureStateStack = [];
		this.setStructure($(event.target).val());
		this.saveAppState();
	},
	setMenuOptions: function (menuSelector, menuOptions) {
		var $menu = this.$el.find(menuSelector);
		$menu.empty();
		menuOptions.forEach(function (menuOption) {
			$('<option>')
				.prop({value: menuOption.value})
				.html(menuOption.label)
				.appendTo($menu);
		});
	},
	changeAction: function () {
		// Disable source pointer dropdown if delete is selected
		var action = this.$el.find('.action-options').val();
		this.$el
			.find('.src-pointer-options')
			.prop('disabled', (action === 'delete'));
	},
	executeAction: function () {
		var action = this.$el.find('.action-options').val();
		var srcPointerId = this.$el.find('.src-pointer-options').val();
		var dstNodeId = this.$el.find('.dst-node-options').val();
		this.structureStateStack.push(this.structureModel.getState());
		if (action === 'set') {
			var status = this.structureModel.setPointer(srcPointerId, dstNodeId);
			// Undo when model reaches impossible state
			if (status === 'undo') {
				this.undoAction();
			} else {
				this.structureView.render();
				this.saveAppState();
			}
		} else if (action === 'delete') {
			this.structureModel.deleteNode(dstNodeId);
			this.structureView.render();
			this.saveAppState();
		}
	},
	undoAction: function () {
		var state = this.structureStateStack.pop();
		if (state) {
			this.structureModel.setState(state);
			this.structureView.render();
			this.saveAppState();
		} else {
			alert('Nothing more to undo!');
		}
	},
	// Recenter canvas translation
	recenterCanvas: function () {
		this.structureView.recenterCanvas();
	},
	resetStructure: function() {
		this.structureModel.reset();
		this.structureView.render();
		this.saveAppState();
	},
	// Saves the entire state of the application to the user's machine for
	// persistence across page loads
	saveAppState: function() {

		var appState = {
			currentStructureState: this.structureModel.getState(),
			structureStateStack: this.structureStateStack,
			controls: {}
		};
		// Retrieve values of every dropdown control
		this.$el.children('select').each(function () {
			var $select = $(this);
			appState.controls[$select.prop('class')] = $select.val();
		});
		localStorage.setItem(
			this.constructor.storageKey,
			JSON.stringify(appState));
	}
}, {
	storageKey: 'data-structure-visualizer',
	maxStructureStates: 100,
	// Options to display in list of available data structures in UI; the
	// 'value' field maps to the exact names of the corresponding model and view
	// constructors
	structureList: [
		{value: 'LinkedList', label: 'Linked List'}
	],
	defaultStructure: 'LinkedList'
});

var controllerView = new app.views.Controller({
	el: $('#controls')[0]
});

}());
