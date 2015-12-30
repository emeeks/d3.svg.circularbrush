d3.svg.circularbrush = function() {
	var _extent = [0,Math.PI * 2];
    var _circularbrushDispatch = d3.dispatch('brushstart', 'brushend', 'brush');
	var _arc = d3.svg.arc().innerRadius(50).outerRadius(100);
	var _brushData = [
		{startAngle: _extent[0], endAngle: _extent[1], class: "extent"},
		{startAngle: _extent[0] - .2, endAngle:  _extent[0], class: "resize e"},
		{startAngle: _extent[1], endAngle: _extent[1] + .2, class: "resize w"}
		];
	var _newBrushData = [];
	var d3_window = d3.select(window);
	var _origin;
	var _brushG;
	var _handleSize = .2;
	var _scale = d3.scale.linear().domain(_extent).range(_extent);
	var _tolerance = 0.00001;

	function _circularbrush(_container) {

		updateBrushData();

		_brushG = _container
		.append("g")
		.attr("class", "circularbrush");

		_brushG
		.selectAll("path.circularbrush")
		.data(_brushData)
		.enter()
		.insert("path", "path.resize")
		.attr("d", _arc)
		.attr("class", function(d) {return d.class + " circularbrush"})

		_brushG.select("path.extent")
		.on("mousedown.brush", resizeDown)

		_brushG.selectAll("path.resize")
		.on("mousedown.brush", resizeDown)

		return _circularbrush;
	}

	_circularbrush.extent = function(_value) {
		var _d = _scale.domain();
		var _r = _scale.range();

		var _actualScale = d3.scale.linear()
		.domain([-_d[1],_d[0],_d[0],_d[1]])
		.range([_r[0],_r[1],_r[0],_r[1]])

		if (!arguments.length) return [_actualScale(_extent[0]),_actualScale(_extent[1])];

		_extent = [_scale.invert(_value[0]),_scale.invert(_value[1])];

		return this
	}

	_circularbrush.handleSize = function(_value) {
		if (!arguments.length) return _handleSize;

		_handleSize = _value;
		_brushData = [
		{startAngle: _extent[0], endAngle: _extent[1], class: "extent"},
		{startAngle: _extent[0] - _handleSize, endAngle:  _extent[0], class: "resize e"},
		{startAngle: _extent[1], endAngle: _extent[1] + _handleSize, class: "resize w"}
		];
		return this
	}

	_circularbrush.innerRadius = function(_value) {
		if (!arguments.length) return _arc.innerRadius();

		_arc.innerRadius(_value);
		return this
	}

	_circularbrush.outerRadius = function(_value) {
		if (!arguments.length) return _arc.outerRadius();

		_arc.outerRadius(_value);
		return this
	}

	_circularbrush.range = function(_value) {
		if (!arguments.length) return _scale.range();

		_scale.range(_value);
		return this
	}

	_circularbrush.arc = function(_value) {
		if (!arguments.length) return _arc;

		_arc = _value;
		return this

	}

	_circularbrush.tolerance = function(_value) {
		if (!arguments.length) return _tolerance;

		_tolerance = _value;
		return this
	}

	_circularbrush.filter = function(_array, _accessor) {
		var data = _array.map(_accessor);

		var extent = _circularbrush.extent();
		var start = extent[0];
		var end = extent[1];
		var firstPoint = _scale.range()[0];
		var lastPoint = _scale.range()[1];
		var filteredArray = [];
		var firstHalf = [];
		var secondHalf = [];

		if (Math.abs(start - end) < _tolerance) {
			return _array;
		}

	    if (start < end) {
	    	filteredArray = _array.filter(function (d) {
	    		return _accessor(d) >= start && _accessor(d) <= end;
	    	});
	    }
	    else {
	      var firstHalf = _array.filter(function (d) {
	         return (_accessor(d) >= start && _accessor(d) <= lastPoint);
	      });
	      var secondHalf = _array.filter(function (d) {
	         return (_accessor(d) <= end && _accessor(d) >= firstPoint);
	      });
		  filteredArray = firstHalf.concat(secondHalf);
	    }

		return filteredArray;

	}

    d3.rebind(_circularbrush, _circularbrushDispatch, "on");

	return _circularbrush;

	function resizeDown(d) {
		var _mouse = d3.mouse(_brushG.node());

		if (_brushData[0] === undefined) {
			_brushData[0] = d;
		}
		_originalBrushData = {startAngle: _brushData[0].startAngle, endAngle: _brushData[0].endAngle};

		_origin = _mouse;

		if (d.class == "resize e") {
			d3_window
			.on("mousemove.brush", function() {resizeMove("e")})
			.on("mouseup.brush", extentUp);
		}
		else if (d.class == "resize w") {
			d3_window
			.on("mousemove.brush", function() {resizeMove("w")})
			.on("mouseup.brush", extentUp);
		}
		else {
			d3_window
			.on("mousemove.brush", function() {resizeMove("extent")})
			.on("mouseup.brush", extentUp);
		}

		_circularbrushDispatch.brushstart();

	}

	function resizeMove(_resize) {
		var _mouse = d3.mouse(_brushG.node());
		var _current = Math.atan2(_mouse[1],_mouse[0]);
		var _start = Math.atan2(_origin[1],_origin[0]);

		if (_resize == "e") {
			var clampedAngle = Math.max(Math.min(_originalBrushData.startAngle + (_current - _start), _originalBrushData.endAngle), _originalBrushData.endAngle - (2 * Math.PI));

			if (_originalBrushData.startAngle + (_current - _start) > _originalBrushData.endAngle) {
				clampedAngle = _originalBrushData.startAngle + (_current - _start) - (Math.PI * 2);
			}
			else if (_originalBrushData.startAngle + (_current - _start) < _originalBrushData.endAngle - (Math.PI * 2)) {
				clampedAngle = _originalBrushData.startAngle + (_current - _start) + (Math.PI * 2);
			}

			var _newStartAngle = clampedAngle;
			var _newEndAngle = _originalBrushData.endAngle;
		}
		else if (_resize == "w") {
			var clampedAngle = Math.min(Math.max(_originalBrushData.endAngle + (_current - _start), _originalBrushData.startAngle), _originalBrushData.startAngle + (2 * Math.PI))

			if (_originalBrushData.endAngle + (_current - _start) < _originalBrushData.startAngle) {
				clampedAngle = _originalBrushData.endAngle + (_current - _start) + (Math.PI * 2);
			}
			else if (_originalBrushData.endAngle + (_current - _start) > _originalBrushData.startAngle + (Math.PI * 2)) {
				clampedAngle = _originalBrushData.endAngle + (_current - _start) - (Math.PI * 2);
			}

			var _newStartAngle = _originalBrushData.startAngle;
			var _newEndAngle = clampedAngle;
		}
		else {
			var _newStartAngle = _originalBrushData.startAngle + (_current - _start * 1);
			var _newEndAngle = _originalBrushData.endAngle + (_current - _start * 1);
		}


		_newBrushData = [
		{startAngle: _newStartAngle, endAngle: _newEndAngle, class: "extent"},
		{startAngle: _newStartAngle - _handleSize, endAngle: _newStartAngle, class: "resize e"},
		{startAngle: _newEndAngle, endAngle: _newEndAngle + _handleSize, class: "resize w"}
		]

		brushRefresh();

		if (_newStartAngle > (Math.PI * 2)) {
			_newStartAngle = (_newStartAngle - (Math.PI * 2));
		}
		else if (_newStartAngle < -(Math.PI * 2)) {
			_newStartAngle = (_newStartAngle + (Math.PI * 2));
		}

		if (_newEndAngle > (Math.PI * 2)) {
			_newEndAngle = (_newEndAngle - (Math.PI * 2));
		}
		else if (_newEndAngle < -(Math.PI * 2)) {
			_newEndAngle = (_newEndAngle + (Math.PI * 2));
		}

		_extent = ([_newStartAngle,_newEndAngle]);

		_circularbrushDispatch.brush();

	}

	function brushRefresh() {
		_brushG
			.selectAll("path.circularbrush")
			.data(_newBrushData)
			.attr("d", _arc)
	}


	function extentUp() {

		_brushData = _newBrushData;
		d3_window.on("mousemove.brush", null).on("mouseup.brush", null);

		_circularbrushDispatch.brushend();
	}

	function updateBrushData() {
		_brushData = [
		{startAngle: _extent[0], endAngle: _extent[1], class: "extent"},
		{startAngle: _extent[0] - _handleSize, endAngle:  _extent[0], class: "resize e"},
		{startAngle: _extent[1], endAngle: _extent[1] + _handleSize, class: "resize w"}
		];
	}


}