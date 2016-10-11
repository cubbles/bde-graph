// @importedBy bde-app.html
/* globals klayCubbles,TheGraph,ReactDOM */
(function () {
  'use strict';
  Polymer({

    is: 'bde-graph',

    properties: {

      editable: {
        type: Boolean,
        value: true
      },

      displaySelectionGroup: {
        type: Boolean,
        value: true,
        notify: true
      },

      forceSelection: {
        type: Boolean,
        value: false,
        notify: true
      },
      /**
       * width of the graph
       *
       * @type {Number}
       * @property width
       */
      width: {
        type: Number,
        notify: true,
        reflectToAttribute: true,
        value: 800
      },

      /**
       * height of the graph
       *
       * @type {Number}
       * @property height
       */
      height: {
        type: Number,
        notify: true,
        reflectToAttribute: true,
        value: 600
      },

      /**
       * A distance of grid points,
       *
       * @type {Number}
       * @property grid
       */
      grid: {
        type: Number,
        value: 72
      },

      snap: {
        type: Number,
        value: 36
      },

      /**
       * offset for x position of the graph. (left side distance distance  of the graph)
       *
       * @type {Number}
       * @property offsetX
       */
      offsetX: {
        type: Number,
        notify: true,
        value: null
      },
      /**
       * offset for y position of the graph. (top distance  of the graph)
       *
       * @type {Number}
       * @property offsetY
       */
      offsetY: {
        type: Number,
        notify: true,
        value: null
      },

      minZoom: {
        type: Number,
        value: 0.15,
        notify: true
      },

      maxZoom: {
        type: Number,
        value: 15,
        notify: true
      },

      pan: {
        type: Object,
        notify: true,
        value: function () {
          return { x: 0, y: 0 };
        }
      },

      scale: {
        type: Number,
        value: 1,
        notify: true
      },

      theme: {
        type: String,
        notify: true,
        reflectToAttribute: true,
        value: 'dark'
      },

      autolayout: {
        type: Boolean,
        value: true
      },

      artifactId: {
        type: String,
        notify: true
      },

      slots: {
        type: Array,
        notify: true,
        value: function () {
          return [];
        }
      },

      /**
       * The list of the members components (nodes) in the graph
       *
       * @type {Array}
       * @property members
       */
      members: {
        type: Array,
        notify: true,
        value: function () {
          return [];
        }
      },

      /**
       * The list of connections (edges) between membrs in the graph
       *
       * @type {Array}
       * @property connections
       */
      connections: {
        type: Array,
        notify: true,
        value: function () {
          return [];
        }
      },

      /**
       * The list of initialisation objects inside of the shown compound components.
       * @type {Array}
       * @property inits
       */
      inits: {
        type: Array,
        notify: true,
        value: function () {
          return [];
        }
      },

      /**
       * A list of component deifinitions used in the graph. (all prototypes of components for the graph.)
       *@type {Array}
       * @property libraray
       */
      library: {
        type: Object,
        value: function () {
          return {};
        }
      },

      menus: {
        type: Object,
        value: function () {
          return {};
        }
      },

      /**
       * The list of selected members.
       *
       * @type {Array}
       * @property selectedMembers
       */
      selectedMembers: {
        type: Array,
        notify: true,
        value: function () {
          return [];
        }
      },

      /**
       * The list of selected connections.
       *
       * @type {Array}
       * @property selectedConnections
       */
      selectedConnections: {
        type: Array,
        notify: true,
        value: function () {
          return [];
        }
      },

      _autolayouter: {
        type: Object,
        value: function () {
          return {};
        }
      },

      _appView: {
        type: Object,
        value: null
      },

      _graph: {
        type: Object,
        value: function () {
          return {};
        }
      },

      _graphView: {
        type: Object,
        value: null
      },

      _selectedEdges: {
        type: Array,
        notify: true,
        value: function () {
          return [];
        }
      }
    },

    observers: [
      'slotsChanged(slots.*)',
      'membersChanged(members.*)',
      'connectionsChanged(connections.*)',
      'initsChanged(inits.*)',
      'panChanged(pan)',
      'themeChanged(theme)',
      'dimensionsChanged(width, height)',
      'autolayoutChanged(autolayout)',
      'displaySelectionGroupChanged(displaySelectionGroup)',
      'forceSelectionChanged(forceSelection)',
      'selectedMembersChanged(selectedMembers.splices)',
      '_selectedEdgesChanged(_selectedEdges.splices)'
    ],

    listeners: {
      'svgcontainer.track': 'noop',
      'svgcontainer.tap': 'noop',
      'svgcontainer.up': 'noop',
      'svgcontainer.down': 'noop'
    },

    created: function () {
      // Initialize the autolayouter
      this._autolayouter = klayCubbles.init({
        onSuccess: this._applyAutolayout.bind(this),
        workerScript: '../../klayjs/klay.js'
      });

      // Attach context menus
      this.defineMenus();
    },

    attached: function () {
      window.addEventListener('resize', this.onResize.bind(this));
      this.onResize();
    },

    onResize: function (event) {
      this.width = this.parentElement.offsetWidth;
      this.height = this.parentElement.offsetHeight;
    },

    noop: function (event) {
      // Don't propagate events beyond the graph
      event.stopPropagation();
    },

    onGraphChanged: function (transaction, metadata) {
      console.log('onGraphChanged', ...arguments);
    },

    onAddEdge: function (edge) {
      var connection = this.getConnectionForEdge(edge);
      if (!connection) {
        this.push('connections', {
          connectionId: Math.random().toString(36).substring(2, 7),
          source: {
            memberIdRef: edge.from.node,
            slot: edge.from.port
          },
          destination: {
            memberIdRef: edge.to.node,
            slot: edge.to.port
          }
        });
      }
    },

    onRemoveEdge: function (edge) {
      var connection = this.getConnectionForEdge(edge);
      var idx = this.connections.indexOf(connection);
      if (idx !== -1) {
        this.splice('connections', idx, 1);
      }
    },

    onAddInport: function (publicPort, port) {
      var slot = this.getSlotForPort(publicPort);
      if (!slot) {
        this.push('slots', {
          slotId: publicPort,
          type: port.type,
          description: port.metadata.description,
          direction: [ 'input' ]
        });
      }
    },

    onRemoveInport: function (key, port) {
      var slot = this.getSlotForPort(key);
      var idx = this.slots.indexOf(slot);
      if (!slot) { return; }

      this.splice('slots', idx, 1);

      if (slot.direction.length > 1) {
        slot.direction = [ 'output' ];
        this.push('slots', slot);
      }
    },

    onAddOutport: function (publicPort, port) {
      var slot = this.getSlotForPort(publicPort);
      if (slot) {
        if (slot.direction.indexOf('output') === -1) {
          this.splice('slots', this.slots.indexOf(slot), 1);
          slot.direction.push('output');
          this.push('slots', slot);
        }
      } else {
        this.push('slots', {
          slotId: publicPort,
          type: port.type,
          description: port.metadata.description,
          direction: [ 'output' ]
        });
      }
    },

    onRemoveOutport: function (key, port) {
      var slot = this.getSlotForPort(key);
      var idx = this.slots.indexOf(slot);
      if (!slot) { return; }

      this.splice('slots', idx, 1);

      if (slot.direction.length > 1) {
        slot.direction = [ 'input' ];
        this.push('slots', slot);
      }
    },

    onAddNode: function (node) {
      var member = this.getMemberForNode(node);
      if (!member) {
        this.push('members', {
          memberId: node.id,
          component: node.component,
          metadata: node.metadata
        });
      }
    },

    onRemoveNode: function (node) {
      var member = this.getMemberForNode(node);
      var idx = this.members.indexOf(member);
      if (member) {
        this.splice('members', idx, 1);
      }
    },

    onRenameNode: function (oldId, newId) {
      // @todo: (fdu) Do we need this?
      // Removing a member would trigger a change in graph
      // so this is actually a removeNode/addNode operation.
    },

    onAddInitial: function (initializer) {},

    onRemoveInitial: function (initializer) {},

    onEdgeSelection: function (itemKey, item, toggle) {
      var index, isSelected, shallowClone;

      if (itemKey === undefined) {
        if (this._selectedEdges.length > 0) {
          this.splice('_selectedEdges', 0, this._selectedEdges.length);
        }
      } else {
        if (toggle) {
          index = this._selectedEdges.indexOf(item);
          isSelected = index !== -1;
          shallowClone = this._selectedEdges.slice();
          if (isSelected) {
            shallowClone.splice(index, 1);
            this.set('_selectedEdges', shallowClone);
          } else {
            shallowClone.push(item);
            this.set('_selectedEdges', shallowClone);
          }
        } else {
          this.splice('_selectedEdges', 0, this._selectedEdges.length);
          this.push('_selectedEdges', item);
        }
      }
    },

    onNodeSelection: function (itemKey, item, toggle) {
      var member, index, isSelected;

      if (itemKey === undefined) {
        this.splice('selectedMembers', 0, this.selectedMembers.length);
        return;
      }

      member = this.getMemberForNode(item);
      index = this.selectedMembers.indexOf(member);
      if (toggle) {
        isSelected = (index !== -1);
        if (isSelected) {
          this.splice('selectedMembers', this.selectedMembers.indexOf(member), 1);
        } else {
          this.push('selectedMembers', member);
        }
      } else {
        this.splice('selectedMembers', 0, this.selectedMembers.length);
        this.push('selectedMembers', member);
      }
    },

    onPanScale: function (x, y, scale) {
      this.set('pan', { x: x, y: y });
      this.set('scale', scale);
    },

    debounceLibraryRefresh: function () {
      this.debounce('debounceLibraryRefresh', function () {
        this.rerender({ libraryDirty: true });
      }, 200);
    },

    /**
     * Define the circular context menus for the graph
     */
    defineMenus: function () {
      var pasteMenu = {
        icon: 'paste',
        iconLabel: 'paste',
        action: function (graph, itemKey, item) {
          var pasted = TheGraph.Clipboard.paste(graph);
          this.set('selectedMembers', pasted.nodes.map(this.getMemberForNode));
          this.set('selectedConnections', []);
        }.bind(this)
      };

      var nodeActions = {
        delete: function (graph, itemKey, item) {
          var member = this.getMemberForNode(item);
          var index = this.members.indexOf(member);
          this.splice('members', index, 1);

          // Remove selection
          var newSelection = this.selectedMembers.filter(function (selected) {
            return selected !== member;
          });
          this.set('selectedMembers', newSelection);
        }.bind(this),

        copy: function (graph, itemKey, item) {
          // @todo: (fdu) handle this
          // TheGraph.Clipboard.copy(graph, [itemKey]);
        }.bind(this) // eslint-disable-line no-extra-bind
      };

      var edgeActions = {
        delete: function (graph, itemKey, item) {
          var connection = this.getConnectionForEdge(item);
          var index = this.connections.indexOf(connection);
          this.splice('connections', index, 1);

          // Remove selection
          var newSelection = this.selectedConnections.filter(function (selected) {
            return selected !== connection;
          });
          this.set('selectedConnections', newSelection);
        }.bind(this)
      };

      this.set('menus', {

        // Background
        main: {
          icon: 'sitemap',
          e4: pasteMenu
        },

        // Connection
        edge: {
          actions: edgeActions,
          icon: 'long-arrow-right',
          s4: {
            icon: 'trash-o',
            iconLabel: 'delete',
            actions: edgeActions.delete
          }
        },

        // Members
        node: {
          actions: nodeActions,
          s4: {
            icon: 'trash-o',
            iconLabel: 'delete',
            action: nodeActions.delete
          },
          w4: {
            icon: 'copy',
            iconLabel: 'copy',
            action: nodeActions.copy
          }
        },

        nodeInport: {
          w4: {
            icon: 'sign-in',
            iconLabel: 'export',
            action: function (graph, itemKey, item) {
              var pub = item.port;

              if (pub === 'start') {
                pub = 'start1';
              }

              if (pub === 'graph') {
                pub = 'graph1';
              }

              var count = 0;
              // Make sure public is unique
              while (graph.inports[ pub ]) {
                pub = item.port + (++count);
              }
              var priNode = graph.getNode(item.process);
              var metadata = {
                x: priNode.metadata.x - 144,
                y: priNode.metadata.y
              };
              graph.addInport(pub, item.type, metadata);
              graph.addEdge(undefined, pub, item.process, item.port, {
                route: 2
              });
            }
          }
        },

        nodeOutport: {
          e4: {
            icon: 'sign-out',
            iconLabel: 'export',
            action: function (graph, itemKey, item) {
              var pub = item.port;
              var count = 0;
              // Make sure public is unique
              while (graph.outports[ pub ]) {
                pub = item.port + (++count);
              }
              var priNode = graph.getNode(item.process);
              var metadata = {
                x: priNode.metadata.x + 144,
                y: priNode.metadata.y
              };
              graph.addOutport(pub, item.type, metadata);
              graph.addEdge(item.process, item.port, undefined, pub, {
                route: 5
              });
            }
          }
        },

        // Exported Slots
        graphInport: {
          icon: 'sign-in',
          iconColor: 2,
          n4: {
            label: 'inport'
          },
          s4: {
            icon: 'trash-o',
            iconLabel: 'delete',
            action: function (graph, itemKey, item) {
              graph.removeInport(itemKey);
            }
          }
        },

        graphOutport: {
          icon: 'sign-out',
          iconColor: 5,
          n4: {
            'label': 'outport'
          },
          s4: {
            icon: 'trash-o',
            iconLabel: 'delete',
            action: function (graph, itemKey, item) {
              graph.removeOutport(itemKey);
            }
          }
        },

        // Selection
        selection: {
          icon: 'th',
          w4: {
            icon: 'copy',
            iconLabel: 'copy',
            action: function (graph, itemKey, item) {
              TheGraph.Clipboard.copy(graph, item.nodes);
            }
          },
          e4: pasteMenu
        }
      });
    },

    /**
     * This is called by the graph, when a context menu is shown.
     */
    getMenuDef: function (options) {
      var defaultMenu;

      // Options: type, graph, itemKey, item
      if (options.type && this.menus[ options.type ]) {
        defaultMenu = this.menus[ options.type ];
        if (defaultMenu.callback) {
          return defaultMenu.callback(defaultMenu, options);
        }
        return defaultMenu;
      }
    },

    /**
     * This will register a component with the graph
     * and force a rerender
     */
    registerComponent: function (definition) {
      var component = this.library[ definition.name ];
      if (component) {
        // Don't override real definition with dummy
        return;
      }
      this.library[ definition.name ] = definition;
      this.notifyPath('library', this.library);

      // Render changes
      this.debounceLibraryRefresh();
    },

    /**
     * Build or rebuild the graph.
     */
    rebuildGraph: function () {
      if (!this._graph) { return; }

      if (this._graph.removeListener) {
        this._graph.removeListener('endTransaction', this.onGraphChanged.bind(this));
      }

      this._graph = window.createGraph(this.artifactId, { caseSensitive: true });

      // Listen for graph changes

      this._graph.on('endTransaction', this.onGraphChanged.bind(this));
      this._graph.on('addEdge', this.onAddEdge.bind(this));
      this._graph.on('removeEdge', this.onRemoveEdge.bind(this));
      this._graph.on('addInport', this.onAddInport.bind(this));
      this._graph.on('removeInport', this.onRemoveInport.bind(this));
      this._graph.on('addOutport', this.onAddOutport.bind(this));
      this._graph.on('removeOutport', this.onRemoveOutport.bind(this));
      this._graph.on('addInitial', this.onAddInitial.bind(this));
      this._graph.on('removeInitial', this.onRemoveInitial.bind(this));

      if (this._appView) {
        // Remove previous instance
        ReactDOM.unmountComponentAtNode(this.$.svgcontainer);
        this._appView = null;
      }

      // Setup app
      this.$.svgcontainer.innerHTML = '';
      this._appView = ReactDOM.render(window.TheGraph.App({
        graph: this._graph,
        width: this.width,
        height: this.height,
        minZoom: this.minZoom,
        maxZoom: this.maxZoom,
        library: this.library,
        menus: this.menus,
        getMenuDef: this.getMenuDef,
        displaySelectionGroup: this.displaySelectionGroup,
        editable: this.editable,
        forceSelection: this.forceSelection,
        onEdgeSelection: this.onEdgeSelection.bind(this),
        onNodeSelection: this.onNodeSelection.bind(this),
        onPanScale: this.onPanScale.bind(this),
        offsetY: this.offsetY,
        offsetX: this.offsetX
      }), this.$.svgcontainer);
      this._graphView = this._appView.refs.graph;
    },

    slotsChanged: function (changeRecord) {
      var i, index, slot, path, key, value;

      if (!changeRecord) { return; }

      // Slots were added or removed
      if (changeRecord.path === 'slots.splices') {
        changeRecord.value.indexSplices.forEach(function (s) {
          // Slots were removed
          s.removed.forEach(function (slot) {
            if (slot.direction.indexOf('input') !== -1) {
              this._graph.removeInport(slot.slotId);
            }
            if (slot.direction.indexOf('output') !== -1) {
              this._graph.removeOutport(slot.slotId);
            }
          }, this);

          // Slot was added
          for (i = 0; i < s.addedCount; i++) {
            index = s.index + i;
            slot = s.object[ index ];
            this._addSlotToGraph(slot);
          }
        }, this);
      } else if (changeRecord.path === 'slots' || changeRecord.path === 'slots.length') {
        // Slots were set
        if (changeRecord.value instanceof Array && changeRecord.value.length > 0) {
          for (let i = 0; i < changeRecord.value.length; i++) {
            this._addSlotToGraph(changeRecord.value[ i ]);
          }
        }
      } else {
        // Slot was modified
        path = changeRecord.path.match(/slots\.(#\d+)\.(\S)$/);
        key = path[ 0 ];
        path = path[ 1 ].split('.');
        value = changeRecord.value;
        slot = Polymer.Collection.get(this.slots).getItem(key);

        // @todo: (fdu) Make it so
        console.warn('Slot changes are not implemented, yet!' + path.join('.') + ' changed to ' + value);
      }
    },

    /**
     * Called if the members list changed. (For Example added or removed members.)
     * @param {Object} changeRecord the polymer changeRecord object
     */
    membersChanged: function (changeRecord) {
      var i, index, member, path;

      if (!changeRecord) { return; }

      // Members were added or remove
      if (changeRecord.path === 'members.splices') {
        changeRecord.value.indexSplices.forEach(function (s) {
          // Members were removed
          s.removed.forEach(function (member) {
            this._graph.removeNode(member.memberId);
          }, this);
          // Members were added
          for (i = 0; i < s.addedCount; i++) {
            index = s.index + i;
            member = s.object[ index ];
            this._addMemberToGraph(member);
          }
        }, this);
      } else if (changeRecord.path === 'members' || changeRecord.path === 'members.length') {
        // Members were set
        if (changeRecord.value instanceof Array && changeRecord.value.length > 0) {
          for (let i = 0; i < changeRecord.value.length; i++) {
            this._addMemberToGraph(changeRecord.value[ i ]);
          }
        }
      } else {
        // Member was modified
        path = changeRecord.path.replace(/(members\.#\d+)(\.\S+)/, '$1'); // Strip everything after the index
        member = this.get(path); // Get the referred member
        this._graph.setNodeMetadata(member.memberId, {
          label: member.displayName || member.memberId,
          description: member.description
        });
      }
    },

    /**
     * Called if the connections list changed. (Added or removed connections.)
     * @param {Object} changeRecord the polymer chamgeRecord object
     */
    connectionsChanged: function (changeRecord) {
      var i, index, conn, metadata, path;

      if (!changeRecord) { return; }

      // Connections were added or removed
      if (changeRecord.path === 'connections.splices') {
        changeRecord.value.indexSplices.forEach(function (s) {
          // Connections were removed
          s.removed.forEach(function (conn) {
            this._graph.removeEdge(
              conn.source.memberIdRef, conn.source.slot,
              conn.destination.memberIdRef, conn.destination.slot
            );
          }, this);

          // Connections were added
          for (i = 0; i < s.addedCount; i++) {
            index = s.index + i;
            conn = s.object[ index ];
            this._addConnectionToGraph(conn);
          }
        }, this);
      } else if (changeRecord.path === 'connections' || changeRecord.path === 'connections.length') {
        // Connections were set
        if (changeRecord.value instanceof Array && changeRecord.value.length > 0) {
          for (let i = 0; i < changeRecord.value.length; i++) {
            this._addConnectionToGraph(changeRecord.value[ i ]);
          }
        }
        // @todo: (fdu) Do we need to do something here?
      } else {
        // Connection was changed
        path = changeRecord.path.replace(/connections\.#\d+(\.\S+)/, ''); // Strip everything after the index
        conn = this.get(path); // Get the referred connection
        metadata = {
          connectionId: conn.connectionId,
          copyValue: conn.copyValue,
          repeatedValues: conn.repeatedValues,
          hookFunction: conn.hookFunction,
          description: conn.description
        };
        this._graph.setEdgeMetadata(
          conn.source.memberIdRef, conn.source.slot,
          conn.destination.memberIdRef, conn.destination.slot,
          metadata
        );
      }
    },
    /**
     * Called if the inits list changed. (Added or removed connections.)
     * @param {Object} changeRecord the polymer chamgeRecord object
     */
    initsChanged: function (changeRecord) {
      var i, index, init, metadata, path;
      if (!changeRecord) { return; }

      // Inits were added or removed
      if (changeRecord.path === 'inits.splices') {
        changeRecord.value.indexSplices.forEach(function (s) {
          // Inits were removed
          s.removed.forEach(function (init) {
            this._graph.removeInitial(init.memberIdRef, init.slot);
          });

          // Inits were added
          for (i = 0; i < s.addedCount; i++) {
            index = s.index + i;
            init = s.object[ index ];
            metadata = {
              description: init.description
            };
            this._graph.addInitial(init.value, init.memberIdRef, init.slot, metadata);
          }
        }, this);
      } else if (changeRecord.path === 'inits' || changeRecord.path === 'inits.length') {
        // Inits were set

        // @todo: (fdu) Do we need to do something here?
      } else {
        // Init was changed
        path = changeRecord.replace(/inits\.#\d+(\.\S+)/, ''); // Strip everything after the index
        init = this.get(path); // Get the referred init
        // @todo: (fdu) Make it so
        console.warn('Init changes are not implemented, yet!', path, 'changed to', init);
      }
    },

    /**
     * Called, if the list of selectedMembers changed by selction or deselection of members,
     * @param {Object} changeRecord the polymer chamgeRecord object
     */
    selectedMembersChanged: function (changeRecord) {
      if (!changeRecord || !this._graphView) { return; }

      var selectedNodesHash = {};
      this.selectedMembers.forEach(function (member) {
        selectedNodesHash[ member.memberId ] = true;
      });

      this._graphView.setSelectedNodes(selectedNodesHash);
    },

    panChanged: function (pan) {
      // Send pan back to React
      if (!this._appView) { return; }
      this._appView.setState(pan);
    },

    themeChanged: function (theme) {
      this.$.svgcontainer.classList.remove('the-graph-dark', 'the-graph-light');
      this.$.svgcontainer.classList.add('the-graph-' + theme);
    },

    dimensionsChanged: function (width, height) {
      if (!this._appView) { return; }
      this._appView.setState({
        width: width,
        height: height
      });
    },

    autolayoutChanged: function (autolayout) {
      if (!this._graph) { return; }

      // Only listen to changes that affect layout
      if (this.autolayout) {
        this._graph.on('addNode', this.triggerAutolayout.bind(this));
        this._graph.on('removeNode', this.triggerAutolayout.bind(this));
        this._graph.on('addInport', this.triggerAutolayout.bind(this));
        this._graph.on('removeInport', this.triggerAutolayout.bind(this));
        this._graph.on('addOutport', this.triggerAutolayout.bind(this));
        this._graph.on('removeOutport', this.triggerAutolayout.bind(this));
        this._graph.on('addEdge', this.triggerAutolayout.bind(this));
        this._graph.on('removeEdge', this.triggerAutolayout.bind(this));
      } else {
        this._graph.removeListener('addNode', this.triggerAutolayout.bind(this));
        this._graph.removeListener('removeNode', this.triggerAutolayout.bind(this));
        this._graph.removeListener('addInport', this.triggerAutolayout.bind(this));
        this._graph.removeListener('removeInport', this.triggerAutolayout.bind(this));
        this._graph.removeListener('addOutport', this.triggerAutolayout.bind(this));
        this._graph.removeListener('removeOutport', this.triggerAutolayout.bind(this));
        this._graph.removeListener('addEdge', this.triggerAutolayout.bind(this));
        this._graph.removeListener('removeEdge', this.triggerAutolayout.bind(this));
      }
    },

    displaySelectionGroupChanged: function (displaySelectionGroup) {
      if (!this._graphView) { return; }
      this._graphView.setState({ displaySelectionGroup: displaySelectionGroup });
    },

    forceSelectionChanged: function (forceSelection) {
      if (!this._graphView) { return; }
      this._graphView.setState({ forceSelection: forceSelection });
    },

    focusMember: function (member) {
      if (!this._graph) { return; }
      var node = this._graph.getNode(member.memberId);

      if (!node) { return; }
      this.$._appView.focusNode(node);
    },

    getConnectionForEdge: function (edge) {
      return this.connections.find(function (conn) {
        return conn.source.memberIdRef === edge.from.node &&
          conn.source.slot === edge.from.port &&
          conn.destination.memberIdRef === edge.to.node &&
          conn.destination.slot === edge.to.port;
      });
    },

    getEdgeFromConnection: function (connection) {
      return {
        'from': {
          'node': connection.source.memberIdRef,
          'port': connection.source.slot
        },
        'metadata': {},
        'to': {
          'node': connection.destination.memberIdRef,
          'port': connection.destination.slot
        }
      };
    },

    getMemberForNode: function (node) {
      return this.members.find(function (member) {
        return member.memberId === node.id;
      });
    },

    getSlotForPort: function (publicPort) {
      return this.slots.find(function (slot) {
        return slot.slotId === publicPort;
      });
    },

    rerender: function (options) {
      if (!this._graphView) { return; }
      this._graphView.markDirty(options);
    },

    triggerFit: function () {
      if (!this._appView) { return; }
      this._appView.triggerFit();
    },

    triggerAutolayout: function () {
      var portInfo = this._graphView ? this._graphView.portInfo : null;

      // Call the autolayouter
      this._autolayouter.layout({
        'graph': this._graph,
        'portInfo': portInfo,
        'direction': 'RIGHT',
        'options': {
          'intCoordinates': true,
          'algorithm': 'de.cau.cs.kieler.klay.layered',
          'layoutHierarchy': true,
          'spacing': 36,
          'borderSpacing': 20,
          'edgeSpacingFactor': 0.2,
          'inLayerSpacingFactor': 2,
          'nodePlace': 'BRANDES_KOEPF',
          'nodeLayering': 'NETWORK_SIMPLEX',
          'edgeRouting': 'POLYLINE',
          'crossMin': 'LAYER_SWEEP',
          'direction': 'RIGHT'
        }
      });
    },
    /* ***********************************************************************/
    /* ***************************** private methods *************************/
    /* ***********************************************************************/
    _addConnectionToGraph: function (conn) {
      var metadata = {
        connectionId: conn.connectionId,
        copyValue: conn.copyValue,
        repeatedValues: conn.repeatedValues,
        hookFunction: conn.hookFunction,
        description: conn.description
      };
      this._graph.addEdge(
        conn.source.memberIdRef, conn.source.slot,
        conn.destination.memberIdRef, conn.destination.slot,
        metadata
      );
    },
    /**
     * Add a node for a member to the graph.
     * @param {Object} member member of the compound
     * @private
     */
    _addMemberToGraph: function (member) {
      var coordinates = this._calculateCoordiantes();

      var metadata = {
        displayName: member.displayName || member.memberId,
        description: member.description,

        x: member.x || coordinates.x,
        y: member.y || coordinates.y
      };
      this._graph.addNode(member.memberId, member.artifactId, metadata);
      if (!this.library[ member.artifactId ]) {
        console.warn('Component', member.artifactId, 'is not defined for the graph');
      }
    },

    _addSlotToGraph: function (slot) {
      var metadata = {
        description: slot.description
      };
      if (slot.direction.indexOf('input') !== -1) {
        this._graph.addInport(slot.slotId, slot.type, metadata);
      }
      if (slot.direction.indexOf('output') !== -1) {
        this._graph.addOutport(slot.slotId, slot.type, metadata);
      }
    },
    _applyAutolayout: function (layoutedKGraph) {
      var nofloNode, klayChild, idSplit, expDirection, expKey, metadata;

      this._graph.startTransaction('autolayout');

      // Update graph nodes with the new coordinates from KIELER graph
      layoutedKGraph.children.forEach(function (klayNode) {
        nofloNode = this._graph.getNode(klayNode.id);

        // Nodes inside groups
        if (klayNode.children) {
          Object.keys(klayNode.children).forEach(function (idx) {
            klayChild = klayNode.children[ idx ];
            if (klayChild.id) {
              this._graph.setNodeMetadata(klayChild.id, {
                x: Math.round((klayNode.x + klayChild.x) / this.snap) * this.snap,
                y: Math.round((klayNode.y + klayChild.y) / this.snap) * this.snap
              });
            }
          }, this);
        }

        metadata = {
          x: Math.round(klayNode.x / this.snap) * this.snap,
          y: Math.round(klayNode.y / this.snap) * this.snap
        };

        // Nodes outside groups
        if (nofloNode) {
          this._graph.setNodeMetadata(klayNode.id, metadata);
        } else {
          // Find inport or outport
          idSplit = klayNode.id.split(':::');
          expDirection = idSplit[ 0 ];
          expKey = idSplit[ 1 ];

          if (expDirection === 'inport' && this._graph.inports[ expKey ]) {
            this._graph.setInportMetadata(expKey, metadata);
          } else if (expDirection === 'outport' && this._graph.outports[ expKey ]) {
            this._graph.setOutportMetadata(expKey, metadata);
          }
        }
      }, this);

      this._graph.endTransaction('autolayout');

      // Fit the window
      this.triggerFit();
    },
    /**
     * Calculate a x and y coordinates of a new member
     * @returns {{x: number, y: number}}
     * @private
     */
    _calculateCoordiantes: function () {
      var x = this._getRandomInt(0, this.grid);
      var y = this._getRandomInt(0, this.grid);
      var coord = {
        x: x,
        y: y
      };
      return coord;
    },

    /**
     * Genereta and get a random integer  between min and max
     * @param {Number} min lower limit for the random integer
     * @param {Number }max upper limit for the random integer
     * @returns {number} the generated random integer
     * @private
     */
    _getRandomInt: function (min, max) {
      var minInt = Math.ceil(min);
      var maxInt = Math.floor(max);
      return Math.floor(Math.random() * (maxInt - minInt)) + minInt;
    },
    _selectedEdgesChanged: function (changeRecord) {
      var i, conn, index;

      if (!changeRecord || !this._graphView) { return; }

      changeRecord.indexSplices.forEach(function (s) {
        s.removed.forEach(function (edge) {
          conn = this.getConnectionForEdge(edge);
          index = this.selectedConnections.indexOf(edge);
          this.splice('selectedConnections', index, 1);
        }, this);

        for (i = 0; i < s.addedCount; i++) {
          index = s.index + i;
          conn = s.object[ index ];
          this.push('selectedConnections', conn);
        }
      }, this);

      this._graphView.setSelectedEdges(this._selectedEdges);
      this.fire('edges', this._selectedEdges);
    }
  });
})();
