(function () {
  'use strict';

  var app = document.querySelector('#app');
  app.components = [];
  app.selectComponent = function (e, detail) {
    var artifactId = detail.item.innerHTML;
    this.$.graph.rebuildGraph();
    var promise = window.cubx.bde.bdeDataConverter.resolveArtifact(artifactId, app.webpackage, app.baseUrl, window.resolutions);
    promise.then((data) => {
      this.$.graph.set('members', data.members);
      this.$.graph.set('slots', data.slots);
      this.$.graph.set('connections', data.connections);
      this.$.graph.set('inits', data.inits);
      data.components.forEach(
        (definition) => this.$.graph.registerComponent(definition)
      );
      requestAnimationFrame(() => this.$.graph.triggerAutolayout());
    });
  };
  app.fetchWebpackage = function () {
    if (!window.resolutions) {
      window.resolutions = {};
    }
    this.$.graph.rebuildGraph();
    var url = app.webpackageUrl;
    if (!url.endsWith('/manifest.webpackage')) {
      url += '/manifest.webpackage';
    }
    var splitUrl = url.split('/');
    for (let i = 0; i < splitUrl.length - 2; i++) {
      if (i === 0) {
        app.baseUrl = splitUrl[ i ] + '//';
      } else if (splitUrl[ i ].length > 0) {
        app.baseUrl += splitUrl[ i ] + '/';
      }
    }

    fetch(url).then((res) => res.json())
      .then((webpackage) => {
        app.webpackage = webpackage;
        app.$.components.innerHTML = '';

        app.$.components.forceSynchronousItemUpdate();
        app.components = [ ...webpackage.artifacts[ 'compoundComponents' ] ];
        app.components.forEach(function (comp) {
          var elem = document.createElement('div');
          elem.setAttribute('name', comp.artifactId);
          elem.innerHTML = comp.artifactId;
          Polymer.dom(this.$.components).appendChild(elem);
        }.bind(app));
        app.$.components.forceSynchronousItemUpdate();
        app.$.componentsFrame.classList.remove('hidden');
        app.$.componentsFrame.classList.add('show');
      });
  };

  app.autolayout = function () {
    this.$.graph.triggerAutolayout();
  };

  app.addRandomMember = function () {
    var components = Object.keys(this.library);
    var component = components[ parseInt(Math.random() * components.length) ];
    this.push('members', {
      memberId: component + '_' + Math.random().toString(36).substring(2, 7),
      componentId: component
    });
  };

  app.addMember = function () {
    var memberId = app.$.memberId.value;
    var componentId = app.$.componentId.value;
    var baseUrl = app.$.baseUrl.value;
    if (memberId && componentId && baseUrl) {
      var member = {
        memberId: memberId,
        componentId: componentId
      };
    }
    var promise = window.cubx.bde.bdeDataConverter.resolveMember(member, app.webpackage, baseUrl, window.resolutions);
    promise.then((data) => {
      this.$.graph.registerComponent(data.component);
      this.$.graph.push('members', data.member);
    });
  };

  app.addEventListener('dom-change', function () {
    this.artifactId = 'test-compound';
    this.theme = 'light';
    if (!window.resolutions) {
      window.resolutions = {};
    }
    this.$.graph.rebuildGraph();
    fetch('debug.json').then((r) => r.json())
      .then((demo) => {
        demo.components.forEach(
          (definition) => this.$.graph.registerComponent(definition)
        );
        this.$.graph.push('members', ...demo.members);
        this.$.graph.push('slots', ...demo.slots);
        this.$.graph.push('connections', ...demo.connections);
        this.$.graph.push('inits', ...demo.inits);
        fetch('manifest.webpackage').then((response) => response.json()).then((webpackage) => {
          this.webpackage = webpackage;
        });
        // Autolayout
        // TheGraph library is not immediatly available...
        requestAnimationFrame(() => this.$.graph.triggerAutolayout());
      });
  });
})();
