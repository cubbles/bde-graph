/* globals React,ReactDOM,unwrap */
(function (context) {
  'use strict';

  var TheGraph = context.TheGraph;

  TheGraph.config.app = {
    container: {
      className: 'the-graph-app',
      name: 'app'
    },
    canvas: {
      ref: 'canvas',
      className: 'app-canvas'
    },
    svg: {
      className: 'app-svg'
    },
    svgGroup: {
      className: 'view'
    },
    graph: {
      ref: 'graph'
    },
    tooltip: {
      ref: 'tooltip'
    },
    modal: {
      className: 'context'
    }
  };

  TheGraph.factories.app = {
    createAppContainer: createAppContainer,
    createAppCanvas: TheGraph.factories.createCanvas,
    createAppSvg: TheGraph.factories.createSvg,
    createAppSvgGroup: TheGraph.factories.createGroup,
    createAppGraph: createAppGraph,
    createAppTooltip: createAppTooltip,
    createAppModalGroup: TheGraph.factories.createGroup,
    createAppModalBackground: createAppModalBackground
  };

  // No need to promote DIV creation to TheGraph.js.
  function createAppContainer (options, content) {
    var args = [ options ];

    if (Array.isArray(content)) {
      args = args.concat(content);
    }

    return React.DOM.div.apply(React.DOM.div, args);
  }

  function createAppGraph (options) {
    return TheGraph.Graph(options);
  }

  function createAppTooltip (options) {
    return TheGraph.Tooltip(options);
  }

  function createAppModalBackground (options) {
    return TheGraph.ModalBG(options);
  }

  TheGraph.App = React.createFactory(React.createClass({
    displayName: 'TheGraphApp',
    mixins: [ React.Animate ],
    getInitialState: function () {
      // Autofit
      var fit = TheGraph.findFit(this.props.graph, this.props.width, this.props.height);

      return {
        x: fit.x,
        y: fit.y,
        scale: fit.scale,
        width: this.props.width,
        height: this.props.height,
        minZoom: this.props.minZoom,
        maxZoom: this.props.maxZoom,
        tooltip: '',
        tooltipX: 0,
        tooltipY: 0,
        tooltipVisible: false,
        contextElement: null,
        contextType: null,
        offsetY: this.props.offsetY,
        offsetX: this.props.offsetX
      };
    },
    zoomFactor: 0,
    zoomX: 0,
    zoomY: 0,
    onWheel: function (event) {
      // Don't bounce
      event.preventDefault();

      if (!this.zoomFactor) { // WAT
        this.zoomFactor = 0;
      }

      // Safari is wheelDeltaY
      this.zoomFactor += event.deltaY ? event.deltaY : 0 - event.wheelDeltaY;
      this.zoomX = event.clientX;
      this.zoomY = event.clientY;
      requestAnimationFrame(this.scheduleWheelZoom);
    },
    scheduleWheelZoom: function () {
      if (isNaN(this.zoomFactor)) { return; }

      // Speed limit
      var zoomFactor = this.zoomFactor / -500;
      zoomFactor = Math.min(0.5, Math.max(-0.5, zoomFactor));
      var scale = this.state.scale + (this.state.scale * zoomFactor);
      this.zoomFactor = 0;

      if (scale < this.state.minZoom) {
        scale = this.state.minZoom;
      } else if (scale > this.state.maxZoom) {
        scale = this.state.maxZoom;
      }
      if (scale === this.state.scale) { return; }

      // Zoom and pan transform-origin equivalent
      var scaleD = scale / this.state.scale;
      var currentX = this.state.x;
      var currentY = this.state.y;
      var oX = this.zoomX;
      var oY = this.zoomY;
      var x = scaleD * (currentX - oX) + oX;
      var y = scaleD * (currentY - oY) + oY;

      this.setState({
        scale: scale,
        x: x,
        y: y,
        tooltipVisible: false
      });
    },
    lastScale: 1,
    lastX: 0,
    lastY: 0,
    pinching: false,
    onTransformStart: function (event) {
      // Don't drag nodes
      event.srcEvent.stopPropagation();
      event.srcEvent.stopImmediatePropagation();

      // Hammer.js
      this.lastScale = 1;
      this.lastX = event.center.x;
      this.lastY = event.center.y;
      this.pinching = true;
    },
    onTransform: function (event) {
      // Don't drag nodes
      event.srcEvent.stopPropagation();
      event.srcEvent.stopImmediatePropagation();

      // Hammer.js
      var currentScale = this.state.scale;
      var currentX = this.state.x;
      var currentY = this.state.y;

      var scaleEvent = event.scale;
      var scaleDelta = 1 + (scaleEvent - this.lastScale);
      this.lastScale = scaleEvent;
      var scale = scaleDelta * currentScale;
      scale = Math.max(scale, this.props.minZoom);

      // Zoom and pan transform-origin equivalent
      var oX = event.center.x;
      var oY = event.center.y;
      var deltaX = oX - this.lastX;
      var deltaY = oY - this.lastY;
      var x = scaleDelta * (currentX - oX) + oX + deltaX;
      var y = scaleDelta * (currentY - oY) + oY + deltaY;

      this.lastX = oX;
      this.lastY = oY;

      this.setState({
        scale: scale,
        x: x,
        y: y,
        tooltipVisible: false
      });
    },
    onTransformEnd: function (event) {
      // Don't drag nodes
      event.srcEvent.stopPropagation();
      event.srcEvent.stopImmediatePropagation();

      // Hammer.js
      this.pinching = false;
    },
    onTrack: function (event) {
      if (event.detail.state === 'track') {
        if (this.pinching) { return; }
        this.setState({
          x: this.state.x + event.detail.ddx,
          y: this.state.y + event.detail.ddy
        });
      } else if (event.detail.state === 'end') {
        // Don't click app (unselect)
        event.stopPropagation();
      }
    },
    onPanScale: function () {
      // Pass pan/scale out to the-graph
      if (this.props.onPanScale) {
        this.props.onPanScale(this.state.x, this.state.y, this.state.scale);
      }
    },
    showContext: function (options) {
      this.setState({
        contextMenu: options,
        tooltipVisible: false
      });
    },
    hideContext: function (event) {
      this.setState({
        contextMenu: null
      });
    },
    changeTooltip: function (event) {
      var tooltip = event.detail.tooltip;

      // Don't go over right edge
      var x = event.detail.x + 10;
      var width = tooltip.length * 6;
      if (x + width > this.props.width) {
        x = event.detail.x - width - 10;
      }

      this.setState({
        tooltip: tooltip,
        tooltipVisible: true,
        tooltipX: x,
        tooltipY: event.detail.y + 20
      });
    },
    hideTooltip: function (event) { // eslint-disable-line no-unuse-vars
      this.setState({
        tooltip: '',
        tooltipVisible: false
      });
    },
    triggerFit: function (event) {
      var fit = TheGraph.findFit(this.props.graph, this.props.width, this.props.height);
      this.setState({
        x: fit.x,
        y: fit.y,
        scale: fit.scale
      });
    },
    focusNode: function (node) {
      var duration = TheGraph.config.focusAnimationDuration;
      var fit = TheGraph.findNodeFit(node, this.state.width, this.state.height);
      var start_point = {
        x: -(this.state.x - this.state.width / 2) / this.state.scale,
        y: -(this.state.y - this.state.height / 2) / this.state.scale
      };
      var end_point = {
        x: node.metadata.x,
        y: node.metadata.y
      };
      var graphfit = TheGraph.findAreaFit(start_point, end_point, this.state.width, this.state.height);
      var scale_ratio_1 = Math.abs(graphfit.scale - this.state.scale);
      var scale_ratio_2 = Math.abs(fit.scale - graphfit.scale);
      var scale_ratio_diff = scale_ratio_1 + scale_ratio_2;

      // Animate zoom-out then zoom-in
      this.animate({
        x: graphfit.x,
        y: graphfit.y,
        scale: graphfit.scale
      }, duration * (scale_ratio_1 / scale_ratio_diff), 'in-quint', function () {
        this.animate({
          x: fit.x,
          y: fit.y,
          scale: fit.scale
        }, duration * (scale_ratio_2 / scale_ratio_diff), 'out-quint');
      }.bind(this));
    },
    edgeStart: function (event) {
      // Listened from PortMenu.edgeStart() and Port.edgeStart()
      this.refs.graph.edgeStart(event);
      this.hideContext();
    },
    componentDidMount: function () {
      var domNode = ReactDOM.findDOMNode(this);

      // Unselect edges and nodes
      if (this.props.onNodeSelection || this.props.onInportSelection || this.props.onOutportSelection) { // jtrs: added onInportSelection, and onOutportSelection
        domNode.addEventListener('tap', this.unselectAll);
      }

      // Pointer gesture event for pan
      domNode.addEventListener('track', this.onTrack);

      // Wheel to zoom
      if (domNode.onwheel !== undefined) {
        // Chrome and Firefox
        domNode.addEventListener('wheel', this.onWheel);
      } else if (domNode.onmousewheel !== undefined) {
        // Safari
        domNode.addEventListener('mousewheel', this.onWheel);
      }

      // Tooltip listener
      domNode.addEventListener('the-graph-tooltip', this.changeTooltip);
      domNode.addEventListener('the-graph-tooltip-hide', this.hideTooltip);

      // Edge preview
      domNode.addEventListener('the-graph-edge-start', this.edgeStart);

      domNode.addEventListener('contextmenu', this.onShowContext);

      // Start zoom from middle if zoom before mouse move
      this.mouseX = Math.floor(this.props.width / 2);
      this.mouseY = Math.floor(this.props.height / 2);

      // HACK metaKey global for taps https://github.com/Polymer/PointerGestures/issues/29
      document.addEventListener('keydown', this.keyDown);
      document.addEventListener('keyup', this.keyUp);

      // Canvas background
      this.bgCanvas = unwrap(ReactDOM.findDOMNode(this.refs.canvas));
      this.bgContext = unwrap(this.bgCanvas.getContext('2d'));
      this.componentDidUpdate();

      // Rerender graph once to fix edges
      setTimeout(function () {
        this.renderGraph();
      }.bind(this), 500);
    },
    onShowContext: function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.preventTap) { event.preventTap(); }

      // Get mouse position
      // var x = event.x || event.clientX || 0;
      // var y = event.y || event.clientY || 0;
      var x = event.x - this.props.offsetX || event.clientX - this.props.offsetX || 0; // jtrs: correcture with offset
      var y = event.y - this.props.offsetY || event.clientY - this.props.offsetY || 0; // jtrs: correcture with offset

      // App.showContext
      this.showContext({
        element: this,
        type: 'main',
        x: x,
        y: y,
        graph: this.props.graph,
        itemKey: 'graph',
        item: this.props.graph
      });
    },
    keyDown: function (event) {
      // HACK metaKey global for taps https://github.com/Polymer/PointerGestures/issues/29
      if (event.metaKey || event.ctrlKey) {
        TheGraph.metaKeyPressed = true;
      }

      var key = event.keyCode;
      var hotKeys = {
        // Delete
        46: function () {
          var graph = this.refs.graph.state.graph;
          var selectedNodes = this.refs.graph.state.selectedNodes;
          var selectedEdges = this.refs.graph.state.selectedEdges;
          var menus = this.props.menus;
          var menuOption = null; // eslint-disable-line no-unused-vars
          var menuAction = null; // eslint-disable-line no-unused-vars
          var nodeKey = null;
          var node = null;
          var edge = null; // eslint-disable-line no-unused-vars

          for (nodeKey in selectedNodes) {
            if (selectedNodes.hasOwnProperty(nodeKey)) {
              node = graph.getNode(nodeKey);
              if (!node) {
                // remove ports if there is no node
                node = graph.inports[nodeKey];
                if (node) {
                  graph.removeInport(nodeKey);
                }
                node = graph.outports[nodeKey];
                if (node) {
                  graph.removeOutport(nodeKey);
                }
              } else {
                menus.node.actions.delete(graph, nodeKey, node);
              }
            }
          }
          selectedEdges.map(function (edge) {
            menus.edge.actions.delete(graph, null, edge);
          });
        }.bind(this),
        // f for fit
        70: function () {
          this.triggerFit();
        }.bind(this)
        // s for selected
        /* 83: function () {
          var graph = this.refs.graph.state.graph;
          var selectedNodes = this.refs.graph.state.selectedNodes;
          var nodeKey = null;
          var node = null;

          for (nodeKey in selectedNodes) {
            if (selectedNodes.hasOwnProperty(nodeKey)) {
              node = graph.getNode(nodeKey);
              this.focusNode(node);
              break;
            }
          }
        }.bind(this) */
      };

      if (hotKeys[ key ]) {
        hotKeys[ key ]();
      }
    },
    keyUp: function (event) {
      // Escape
      if (event.keyCode === 27) {
        if (!this.refs.graph) {
          return;
        }
        this.refs.graph.cancelPreviewEdge();
      }
      // HACK metaKey global for taps https://github.com/Polymer/PointerGestures/issues/29
      if (TheGraph.metaKeyPressed) {
        TheGraph.metaKeyPressed = false;
      }
    },
    unselectAll: function (event) {
      // No arguments = clear selection
      this.props.onNodeSelection();
      this.props.onInportSelection(); // jtrs: added onInportSelection
      this.props.onOutportSelection(); // jtrs: added onOutportSelection
      this.props.onEdgeSelection();
    },
    renderGraph: function () {
      this.refs.graph.markDirty();
    },
    componentDidUpdate: function (prevProps, prevState) {
      this.renderCanvas(this.bgContext);
      if (!prevState || prevState.x !== this.state.x || prevState.y !== this.state.y || prevState.scale !== this.state.scale) {
        this.onPanScale();
      }
    },
    renderCanvas: function (c) {
      // Comment this line to go plaid
      c.clearRect(0, 0, this.state.width, this.state.height);

      // Background grid pattern
      var scale = this.state.scale;
      var g = TheGraph.config.nodeSize * scale;

      var dx = this.state.x % g;
      var dy = this.state.y % g;
      var cols = Math.floor(this.state.width / g) + 1;
      var row = Math.floor(this.state.height / g) + 1;
      // Origin row/col index
      var oc = Math.floor(this.state.x / g) + (this.state.x < 0 ? 1 : 0);
      var or = Math.floor(this.state.y / g) + (this.state.y < 0 ? 1 : 0);

      while (row--) {
        var col = cols;
        while (col--) {
          var x = Math.round(col * g + dx);
          var y = Math.round(row * g + dy);
          if ((oc - col) % 3 === 0 && (or - row) % 3 === 0) {
            // 3x grid
            c.fillStyle = 'white';
            c.fillRect(x, y, 1, 1);
          } else if (scale > 0.5) {
            // 1x grid
            c.fillStyle = 'grey';
            c.fillRect(x, y, 1, 1);
          }
        }
      }
    },

    getContext: function (menu, options, hide) {
      return TheGraph.Menu({
        menu: menu,
        options: options,
        triggerHideContext: hide,
        label: '', // jtrs: changed label
        graph: this.props.graph,
        node: this,
        ports: [],
        process: [],
        processKey: null,
        x: options.x,
        y: options.y,
        nodeWidth: this.props.width,
        nodeHeight: this.props.height,
        deltaX: 0,
        deltaY: 0,
        highlightPort: false
      });
    },
    render: function () {
      // console.timeEnd('App.render');
      // console.time('App.render');

      // pan and zoom
      var sc = this.state.scale;
      var x = this.state.x;
      var y = this.state.y;
      var transform = 'matrix(' + sc + ',0,0,' + sc + ',' + x + ',' + y + ')';

      var scaleClass = sc > TheGraph.zbpBig ? 'big' : (sc > TheGraph.zbpNormal ? 'normal' : 'small');

      var contextMenu, contextModal;
      if (this.state.contextMenu) {
        var options = this.state.contextMenu;
        var menu = this.props.getMenuDef(options);
        if (menu) {
          contextMenu = options.element.getContext(menu, options, this.hideContext);
        }
      }
      if (contextMenu) {
        var modalBGOptions = {
          width: this.state.width,
          height: this.state.height,
          triggerHideContext: this.hideContext,
          children: contextMenu
        };

        contextModal = [
          TheGraph.factories.app.createAppModalBackground(modalBGOptions)
        ];
        this.menuShown = true;
      } else {
        this.menuShown = false;
      }

      var graphElementOptions = {
        graph: this.props.graph,
        scale: this.state.scale,
        app: this,
        library: this.props.library,
        onNodeSelection: this.props.onNodeSelection,
        onOutportSelection: this.props.onOutportSelection, // jtrs: added onOutportSelection
        onInportSelection: this.props.onInportSelection, // jtrs: added onInportSelection
        onEdgeSelection: this.props.onEdgeSelection,
        showContext: this.showContext
      };
      graphElementOptions = TheGraph.merge(TheGraph.config.app.graph, graphElementOptions);
      var graphElement = TheGraph.factories.app.createAppGraph.call(this, graphElementOptions);

      var svgGroupOptions = TheGraph.merge(TheGraph.config.app.svgGroup, { transform: transform });
      var svgGroup = TheGraph.factories.app.createAppSvgGroup.call(this, svgGroupOptions, [ graphElement ]);

      var tooltipOptions = {
        x: this.state.tooltipX,
        y: this.state.tooltipY,
        visible: this.state.tooltipVisible,
        label: this.state.tooltip
      };

      tooltipOptions = TheGraph.merge(TheGraph.config.app.tooltip, tooltipOptions);
      var tooltip = TheGraph.factories.app.createAppTooltip.call(this, tooltipOptions);

      var modalGroupOptions = TheGraph.merge(TheGraph.config.app.modal, { children: contextModal });
      var modalGroup = TheGraph.factories.app.createAppModalGroup.call(this, modalGroupOptions);

      var svgContents = [
        svgGroup,
        tooltip,
        modalGroup
      ];

      var svgOptions = TheGraph.merge(TheGraph.config.app.svg, { width: this.state.width, height: this.state.height });
      var svg = TheGraph.factories.app.createAppSvg.call(this, svgOptions, svgContents);

      var canvasOptions = TheGraph.merge(TheGraph.config.app.canvas, {
        width: this.state.width,
        height: this.state.height
      });
      var canvas = TheGraph.factories.app.createAppCanvas.call(this, canvasOptions);

      var appContents = [
        canvas,
        svg
      ];
      var containerOptions = TheGraph.merge(TheGraph.config.app.container, {
        style: {
          width: this.state.width,
          height: this.state.height
        }
      });
      containerOptions.className += ' ' + scaleClass;
      return TheGraph.factories.app.createAppContainer.call(this, containerOptions, appContents);
    }
  }));
})(this);
