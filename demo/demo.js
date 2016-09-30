(function () {
  'use strict';

  var app = document.querySelector('#app');
  app.components = [];
  app.selectComponent = function (e, detail) {
    var artifactId = detail.item.innerHTML;
    this.$.graph.rebuildGraph();
    console.log(artifactId);
    var promise = window.cubx.bde.bdeDataConverter.convertArtifact(app.webpackage, artifactId, app.baseUrl);
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
        console.log(webpackage);
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

  app.addMember = function () {
    var components = Object.keys(this.library);
    var component = components[ parseInt(Math.random() * components.length) ];
    this.push('members', {
      memberId: component + '_' + Math.random().toString(36).substring(2, 7),
      componentId: component
    });
  };

  app.addEventListener('dom-change', function () {
    this.artifactId = 'test-compound';
    this.theme = 'light';

    fetch('debug.json').then((r) => r.json())
      .then((demo) => {
        demo.components.forEach(
          (definition) => this.$.graph.registerComponent(definition)
        );
        this.$.graph.push('members', ...demo.members);
        this.$.graph.push('slots', ...demo.slots);
        this.$.graph.push('connections', ...demo.connections);
        this.$.graph.push('inits', ...demo.inits);

        // Autolayout
        // TheGraph library is not immediatly available...
        requestAnimationFrame(() => this.$.graph.triggerAutolayout());
      });
  });
})();
