/* jshint devel: true */
(function ($, _, Backbone, Raphael, app) {

app.views.LinkedList = Backbone.View.extend({
	events: {
		'mousedown .pointer-body': 'onPressSrc',
		'mousedown .node-body': 'onPressDst',
		'mousedown .null': 'onPressDst'
	},
	initialize: function () {
		this.$el.empty();
		this.paper = Raphael(this.el, 800, 400);
		this.render();
		this.setStep(0);
	},
	drawNodeText: function (node, x, y) {
		var styles = this.constructor.styles;
		this.paper.text(
			x + styles.nodeWidth / 2,
			y + styles.nodeHeight / 2,
			String(node.get('elem'))
		).attr({
			'font-size': styles.nodeFontSize
		}).node.setAttribute(
			'class', 'node-elem'
		);
	},
	drawNodeBody: function (node, x, y) {
		var styles = this.constructor.styles;
		this.paper.rect(
			x, y,
			styles.nodeWidth, styles.nodeHeight
		).node.setAttribute(
			'class', 'node-body'
		);
	},
	drawNodePointerArrow: function (node, nextNode, x, y) {
		var styles = this.constructor.styles;
		this.paper.path([
			'M',
			(x + styles.nodeWidth),
			(y + styles.nodeHeight / 2),
			'L',
			(x + styles.nodeWidth + styles.nodeSpace - styles.pointerSpaceEnd),
			(y + styles.nodeHeight / 2)
		]).attr({
			'arrow-end': 'block-wide-long'
		}).node.setAttribute(
			'class', 'pointer-arrow'
		);
	},
	drawNodePointerCircle: function (node, x, y) {
		var styles = this.constructor.styles;
		this.paper.circle(
			x + styles.nodeWidth,
			y + styles.nodeHeight / 2,
			styles.nodePointerRadius
		).node.setAttribute(
			'class', 'pointer-body'
		);
	},
	drawNull: function (node, x, y) {
		var styles = this.constructor.styles;
		this.paper.path([
			'M',
			(x + styles.nodeWidth - styles.nodePointerRadius),
			(y + styles.nodeHeight / 2 + styles.nodePointerRadius),
			'L',
			(x + styles.nodeWidth + styles.nodePointerRadius),
			(y + styles.nodeHeight / 2 + styles.nodePointerRadius),
			'L',
			(x + styles.nodeWidth + styles.nodePointerRadius),
			(y + styles.nodeHeight / 2 - styles.nodePointerRadius),
			'L',
			(x + styles.nodeWidth - styles.nodePointerRadius),
			(y + styles.nodeHeight / 2 - styles.nodePointerRadius),
			'Z',
			'M',
			(x + styles.nodeWidth - styles.nodePointerRadius),
			(y + styles.nodeHeight / 2 + styles.nodePointerRadius),
			'L',
			(x + styles.nodeWidth + styles.nodePointerRadius),
			(y + styles.nodeHeight / 2 - styles.nodePointerRadius),
			'M',
			(x + styles.nodeWidth - styles.nodePointerRadius),
			(y + styles.nodeHeight / 2 - styles.nodePointerRadius),
			'L',
			(x + styles.nodeWidth + styles.nodePointerRadius),
			(y + styles.nodeHeight / 2 + styles.nodePointerRadius),
		]).node.setAttribute(
			'class', 'null'
		);
	},
	drawNodePointer: function (node, x, y) {
		var nextNode = node.get('next');
		var styles = this.constructor.styles;
		this.drawNodePointerArrow(node, nextNode, x, y);
		this.drawNodePointerCircle(node, x, y);
		if (!nextNode) {
			this.drawNull(
				node,
				x + styles.nodeSpace + styles.pointerSpaceEnd,
				y
			);
		}
	},
	drawNode: function (node, x, y) {
		var group = this.paper.set();
		var styles = this.constructor.styles;
		this.drawNodeBody(node, x, y);
		this.drawNodeText(node, x, y);
		this.drawNodePointer(node, x, y);
	},
	drawLabelPointer: function (node, x, y, labelId, labelName) {
		var styles = this.constructor.styles;
		var bodyWidth = (styles.nodeWidth / 2);
		var bodyHeight = styles.pointerFontSize + (styles.pointerLabelPaddingY * 2);
		this.paper.rect(
			(x + styles.nodeWidth / 2) - (bodyWidth / 2),
			(y - styles.nodeSpace + (styles.pointerFontSize / 2)) - (bodyHeight / 2),
			bodyWidth,
			bodyHeight
		).node.setAttribute(
			'class', 'pointer-body'
		);
		this.paper.text(
			(x + styles.nodeWidth / 2),
			(y - styles.nodeSpace + (styles.pointerFontSize / 2)),
			labelName
		).attr({
			'font-size': styles.pointerFontSize
		}).node.setAttribute(
			'class', labelId + '-label pointer-label'
		);
		this.paper.path([
			'M',
			(x + styles.nodeWidth / 2),
			(y - styles.nodeSpace + (styles.pointerSpaceEnd * 2)),
			'L',
			(x + styles.nodeWidth / 2),
			(y - styles.pointerSpaceEnd)
		]).attr({
			'arrow-end': 'block-wide-long'
		}).node.setAttribute(
			'class', 'pointer-arrow'
		);
	},
	render: function () {
		var front = this.model.get('front');
		var rear = this.model.get('rear');
		var p = front;
		var styles = this.constructor.styles;
		var x = styles.canvasPaddingX;
		var y = styles.canvasPaddingY;
		var dx = styles.nodeWidth +
			styles.nodeSpace;
		while (p !== null) {
			this.drawNode(p, x, y);
			if (p === front && p === rear) {
				this.drawLabelPointer(p, x - styles.nodeWidth/3, y, 'front', 'Front');
				this.drawLabelPointer(p, x + styles.nodeWidth/3, y, 'rear', 'Rear');
			} else if (p === front) {
				this.drawLabelPointer(p, x, y, 'front', 'Front');
			} else if (p === rear) {
				this.drawLabelPointer(p, x, y, 'rear', 'Rear');
			}
			p = p.get('next');
			x += dx;
		}
	},
	setStep: function (stepNum) {
		this.step = stepNum;
		console.log('proceed to step ' + stepNum);
		$(this.paper.canvas).removeClass().addClass('step-' + stepNum);
	},
	onPressSrc: function (event) {
		var $pointer = $(event.target);
		if (this.step === 1 && $pointer.hasClass('src-pointer')) {
			// do something with this.model here
			$pointer.removeClass('src-pointer');
			this.setStep(0);
		} else if (this.step === 0) {
			// do something with this.model here
			$pointer.addClass('src-pointer');
			this.setStep(1);
		}
	},
	onPressDst: function (event) {
		var $node = $(event.target);
		if (this.step === 2 && $node.hasClass('dst-node')) {
			// do something with this.model here
			$node.removeClass('dst-node');
			this.setStep(1);
		} else if (this.step === 1) {
			// do something with this.model here
			$node.addClass('dst-node');
			this.setStep(2);
		}
	}
}, {
	styles: {
		canvasPaddingX: 50,
		canvasPaddingY: 80,
		nodeWidth: 80,
		nodeHeight: 60,
		nodePointerRadius: 10,
		pointerSpaceEnd: 10,
		nodeSpace: 50,
		nodeFontSize: 24,
		pointerFontSize: 14,
		pointerLabelPaddingY: 2
	}
});

}(jQuery, window._, window.Backbone, window.Raphael, window.app));
