(function () {
  'use strict';
  describe('bde-data-converter', function () {
    describe('basics', function () {
      it('bde-data-converter should be exists', function () {
        expect(window.cubx.bde.bdeDataConverter).to.be.exists;
      });
      it('window.cubx.bde.bdeDataConverter should be exists', function () {
        expect(window.cubx.bde.bdeDataConverter).to.be.exists;
      });
      it('bde-data-converter should have property "resolveArtifact"', function () {
        window.cubx.bde.bdeDataConverter.should.have.property('resolveArtifact');
      });
      it('bde-data-converter should have property "resolveMember"', function () {
        window.cubx.bde.bdeDataConverter.should.have.property('resolveMember');
      });
      it('bde-data-converter should have method "resolveArtifact"', function () {
        window.cubx.bde.bdeDataConverter.resolveArtifact.should.be.a('function');
      });
      it('bde-data-converter should have method "resolveMember"', function () {
        window.cubx.bde.bdeDataConverter.resolveMember.should.be.a('function');
      });
      it('bde-data-converter should have a property compoundIcon="cogs"', function () {
        window.cubx.bde.bdeDataConverter.should.have.ownProperty('compoundIcon', 'cogs');
      });
      it('bde-data-converter should have a property elementaryIcon="cog"', function () {
        window.cubx.bde.bdeDataConverter.should.have.ownProperty('elementaryIcon', 'cog');
      });
    });
  });
  describe('#resolveArtifact', function () {
    describe('minimal webpackage', function () {
      var manifestCharts;
      before(function (done) {
        // Get test manifest
        var url = 'resources/minimal/manifest.webpackage';
        fetch(url).then((res) => res.json())
          .then(function (manifest) {
            manifestCharts = manifest;
            done();
          });
      });
      var convertedData;
      beforeEach(function (done) {
        // call convertData function
        var promise = new Promise(function (resolve, reject) {
          var convertedDataPromise = window.cubx.bde.bdeDataConverter.resolveArtifact('test-compound', manifestCharts, 'https://cubbles.world/sandbox/');
          convertedDataPromise.should.be.instanceof(Promise);
          convertedDataPromise.then((convertedData) => {
            resolve(convertedData);
          });
        });
        promise.then(function (data) {
          convertedData = data;
          done();
        });
      });
      it('converted artifact is an object', function () {
        convertedData.should.be.an('object');
      });
      it('should have empty connections property', function () {
        convertedData.should.have.property('connections');
        convertedData.connections.should.have.length(0);
      });
      it('should have empty inits property', function () {
        convertedData.should.have.property('inits');
        convertedData.inits.should.have.length(0);
      });
      it('should have empty slots property', function () {
        convertedData.should.have.property('slots');
        convertedData.slots.should.have.length(0);
      });
      it('should have empty members property', function () {
        convertedData.should.have.property('members');
        convertedData.members.should.have.length(0);
      });
      it('should have 1 elemets in components', function () {
        convertedData.components.should.have.length(1);
        convertedData.components[ 0 ].name.should.be.equals('test-compound');
      });
      it('should the first element in components should be right structure for compound components', function () {
        var component = convertedData.components[ 0 ];
        component.should.have.property('name', 'test-compound');
        component.should.have.property('icon', 'cogs');
        component.should.have.property('inports');
        component.should.have.property('outports');
        component.inports.should.have.length('0');
        component.outports.should.have.length('0');
      });
    });
    describe('all members in webpackage', function () {
      var manifestCharts;
      before(function (done) {
        // Get test manifest
        var url = 'resources/com.incowia.lib.chart-library@0.1.0-SNAPSHOT/manifest.webpackage';
        fetch(url).then((res) => res.json())
          .then(function (manifest) {
            manifestCharts = manifest;
            done();
          });
      });
      var convertedData;
      var artifact;
      var resolutions;
      beforeEach(function (done) {
        resolutions = {};
        // call convertData function

        var promise = new Promise(function (resolve, reject) {
          var convertedDataPromise = window.cubx.bde.bdeDataConverter.resolveArtifact('bar-chart', manifestCharts, 'https://cubbles.world/sandbox/', resolutions);
          convertedDataPromise.should.be.instanceof(Promise);
          convertedDataPromise.then((convertedData) => {
            resolve(convertedData);
          });
        });
        artifact = manifestCharts.artifacts.compoundComponents.find((artifact) => artifact.artifactId === 'bar-chart');
        promise.then(function (data) {
          convertedData = data;
          done();
        });
      });
      it('converted artifact is an object', function () {
        convertedData.should.be.an('object');
      });
      it('should have connection as in the manifest', function () {
        convertedData.connections.should.be.eql(artifact.connections);
      });
      it('should have inits as in the manifest', function () {
        convertedData.inits.should.be.eql(artifact.inits);
      });
      it('should have slots as in the manifest', function () {
        convertedData.slots.should.be.eql(artifact.slots);
      });
      it('should have members, the attribute componentId contains just artifactId', function () {
        convertedData.members.should.have.length(1);
        convertedData.members[ 0 ].should.have.property('memberId', 'chart1');
        convertedData.members[ 0 ].should.have.property('componentId', 'base-chart');
      });
      it('should have 2 elemets in components', function () {
        convertedData.components.should.have.length(2);
        convertedData.components[ 0 ].name.should.be.equals('bar-chart');
        convertedData.components[ 1 ].name.should.be.equals('base-chart');
      });
      it('should the first element in components should be right structure for compound components', function () {
        var component = convertedData.components[ 0 ];
        component.should.have.property('name', 'bar-chart');
        component.should.have.property('icon', 'cogs');
        component.should.have.property('inports');
        component.should.have.property('outports');
        component.inports.should.have.length('4');
        component.inports[ 0 ].should.have.property('name', 'dataColumns');
        component.inports[ 0 ].should.have.property('type', 'object');
        component.inports[ 1 ].should.have.property('name', 'xLabels');
        component.inports[ 1 ].should.have.property('type', 'object');
        component.inports[ 2 ].should.have.property('name', 'testInputOutput');
        component.inports[ 2 ].should.have.property('type', 'string');
        component.inports[ 3 ].should.have.property('name', 'test');
        component.inports[ 3 ].should.have.property('type', 'object');
        component.outports.should.have.length('3');
        component.outports[ 0 ].should.have.property('name', 'testInputOutput');
        component.outports[ 0 ].should.have.property('type', 'string');
        component.outports[ 1 ].should.have.property('name', 'testOutput');
        component.outports[ 1 ].should.have.property('type', 'number');
        component.outports[ 2 ].should.have.property('name', 'test');
        component.outports[ 2 ].should.have.property('type', 'object');
      });
      it('should the second element in components should be right structure for elementary components', function () {
        var component = convertedData.components[ 1 ];
        component.should.have.property('name', 'base-chart');
        component.should.have.property('icon', 'cog');
        component.should.have.property('inports');
        component.should.have.property('outports');
        component.inports.should.have.length('3');
        component.inports[ 0 ].should.have.property('name', 'dataColumns');
        component.inports[ 0 ].should.have.property('type', 'object');
        component.inports[ 1 ].should.have.property('name', 'xLabels');
        component.inports[ 1 ].should.have.property('type', 'object');
        component.inports[ 2 ].should.have.property('name', 'type');
        component.inports[ 2 ].should.have.property('type', 'string');
        component.outports.should.have.length('0');
      });
      it('should be all components in resolutions', function () {
        Object.getOwnPropertyNames(resolutions).should.have.length(2);
        resolutions['bar-chart'].should.have.property('artifact');
        resolutions['bar-chart'].artifact.should.be.eql(manifestCharts.artifacts.compoundComponents.find((comp) => comp.artifactId === 'bar-chart'));
        resolutions['bar-chart'].should.have.property('componentId', 'this/bar-chart');
        resolutions['base-chart'].should.have.property('artifact');
        resolutions['base-chart'].artifact.should.be.eql(manifestCharts.artifacts.elementaryComponents.find((comp) => comp.artifactId === 'base-chart'));
        resolutions['base-chart'].should.have.property('componentId', 'this/base-chart');
      });
    });
    describe('convert artifact with member reference to other webpackage', function () {
      var convertedData;
      var artifact;
      var webpackageManifest;
      var basicHtmlComponentWebpackage;
      var server;
      var resolutions;
      before(function (done) {
        // Get test manifest
        var url = 'resources/my-webpackage@0.1.0/manifest.webpackage';
        var promises = [];
        promises.push(new Promise(function (resolve, reject) {
          fetch(url).then((res) => res.json())
            .then(function (manifest) {
              webpackageManifest = manifest;
              resolve(webpackageManifest);
            });
        }));
        url = 'resources/com.incowia.basic-html-components@0.1.0-SNAPSHOT/manifest.webpackage';
        promises.push(new Promise(function (resolve, reject) {
          fetch(url).then((res) => res.json())
            .then(function (manifest) {
              basicHtmlComponentWebpackage = manifest;
              resolve(basicHtmlComponentWebpackage);
            });
        }));
        Promise.all(promises).then((values) => done());
      });
      beforeEach(function (done) {
        resolutions = {};
        // define server response
        server = sinon.fakeServer.create();
        server.respondWith('GET', 'https://cubbles.world/sandbox/com.incowia.basic-html-components@0.1.0-SNAPSHOT/manifest.webpackage', [ 200,
          { 'Content-Type': 'application/octet-stream' },
          JSON.stringify(basicHtmlComponentWebpackage) ]);
        // call convertData function
        var promise = new Promise(function (resolve, reject) {
          var convertedDataPromise = window.cubx.bde.bdeDataConverter.resolveArtifact('my-compound', webpackageManifest, 'https://cubbles.world/sandbox/', resolutions);
          convertedDataPromise.should.be.instanceof(Promise);
          convertedDataPromise.then((convertedData) => {
            resolve(convertedData);
          });
        });
        artifact = webpackageManifest.artifacts.compoundComponents.find((artifact) => artifact.artifactId === 'my-compound');
        promise.then(function (data) {
          convertedData = data;
          done();
        });
      });

      afterEach(function () {
        server = null;
      });
      it('converted artifact is an object', function () {
        convertedData.should.be.an('object');
      });
      it('should have connection as in the manifest', function () {
        convertedData.connections.should.be.eql(artifact.connections);
      });
      it('should have inits as in the manifest', function () {
        convertedData.inits.should.be.eql(artifact.inits);
      });
      it('should have slots as in the manifest', function () {
        convertedData.slots.should.be.eql(artifact.slots);
      });
      it('should have members, the attribute componentId contains just artifactId', function () {
        convertedData.members.should.have.length(1);
        convertedData.members[ 0 ].should.have.property('memberId', 'input');
        convertedData.members[ 0 ].should.have.property('componentId', 'cubx-input');
      });
      it('should have 2 elemets in components', function () {
        convertedData.components.should.have.length(2);
        convertedData.components[ 0 ].name.should.be.equals('my-compound');
        convertedData.components[ 1 ].name.should.be.equals('cubx-input');
      });
      it('should the first element in components should be right structure for compound components', function () {
        var component = convertedData.components[ 0 ];
        component.should.have.property('name', 'my-compound');
        component.should.have.property('icon', 'cogs');
        component.should.have.property('inports');
        component.should.have.property('outports');
        component.inports.should.have.length('1');
        component.inports[ 0 ].should.have.property('name', 'outdoor-temperature');
        component.inports[ 0 ].should.have.property('type', 'number');
        component.outports.should.have.length('1');
        component.outports[ 0 ].should.have.property('name', 'outdoor-temperature');
        component.outports[ 0 ].should.have.property('type', 'number');
      });
      it('should the second element in components should be right structure for elementary components', function () {
        var component = convertedData.components[ 1 ];
        component.should.have.property('name', 'cubx-input');
        component.should.have.property('icon', 'cog');
        component.should.have.property('inports');
        component.should.have.property('outports');
        component.inports.should.have.length('21');
        component.inports[ 0 ].should.have.property('name', 'id');
        component.inports[ 0 ].should.have.property('type', 'string');
        component.inports[ 1 ].should.have.property('name', 'type');
        component.inports[ 1 ].should.have.property('type', 'string');
        component.inports[ 2 ].should.have.property('name', 'name');
        component.inports[ 2 ].should.have.property('type', 'string');
        component.inports[ 3 ].should.have.property('name', 'required');
        component.inports[ 3 ].should.have.property('type', 'boolean');
        component.inports[ 4 ].should.have.property('name', 'readonly');
        component.inports[ 4 ].should.have.property('type', 'boolean');
        component.inports[ 5 ].should.have.property('name', 'disabled');
        component.inports[ 5 ].should.have.property('type', 'boolean');
        component.inports[ 6 ].should.have.property('name', 'label');
        component.inports[ 6 ].should.have.property('type', 'string');
        component.inports[ 7 ].should.have.property('name', 'value');
        component.inports[ 7 ].should.have.property('type', 'string');
        component.inports[ 8 ].should.have.property('name', 'placeholder');
        component.inports[ 8 ].should.have.property('type', 'string');
        component.inports[ 9 ].should.have.property('name', 'min');
        component.inports[ 9 ].should.have.property('type', 'number');
        component.inports[ 10 ].should.have.property('name', 'max');
        component.inports[ 10 ].should.have.property('type', 'number');
        component.inports[ 11 ].should.have.property('name', 'step');
        component.inports[ 11 ].should.have.property('type', 'number');
        component.inports[ 12 ].should.have.property('name', 'checked');
        component.inports[ 12 ].should.have.property('type', 'boolean');
        component.inports[ 13 ].should.have.property('name', 'accept');
        component.inports[ 13 ].should.have.property('type', 'string');
        component.inports[ 14 ].should.have.property('name', 'alt');
        component.inports[ 14 ].should.have.property('type', 'string');
        component.inports[ 15 ].should.have.property('name', 'height');
        component.inports[ 15 ].should.have.property('type', 'number');
        component.inports[ 16 ].should.have.property('name', 'width');
        component.inports[ 16 ].should.have.property('type', 'number');
        component.inports[ 17 ].should.have.property('name', 'src');
        component.inports[ 17 ].should.have.property('type', 'string');
        component.inports[ 18 ].should.have.property('name', 'rightText');
        component.inports[ 18 ].should.have.property('type', 'string');
        component.inports[ 19 ].should.have.property('name', 'tabindex');
        component.inports[ 19 ].should.have.property('type', 'number');
        component.inports[ 20 ].should.have.property('name', 'customValue');
        component.inports[ 20 ].should.have.property('type', 'object');
        component.outports.should.have.length('4');
        component.outports[ 0 ].should.have.property('name', 'value');
        component.outports[ 0 ].should.have.property('type', 'string');
        component.outports[ 1 ].should.have.property('name', 'checked');
        component.outports[ 1 ].should.have.property('type', 'boolean');
        component.outports[ 2 ].should.have.property('name', 'customValue');
        component.outports[ 2 ].should.have.property('type', 'object');
        component.outports[ 3 ].should.have.property('name', 'changeObject');
        component.outports[ 3 ].should.have.property('type', 'object');
      });
      it('should be all components in resolutions', function () {
        Object.getOwnPropertyNames(resolutions).should.have.length(2);
        resolutions['my-compound'].should.have.property('artifact');
        resolutions['my-compound'].artifact.should.be.eql(webpackageManifest.artifacts.compoundComponents.find((comp) => comp.artifactId === 'my-compound'));
        resolutions['my-compound'].should.have.property('componentId', 'this/my-compound');
        resolutions['cubx-input'].should.have.property('artifact');
        resolutions['cubx-input'].artifact.should.be.eql(basicHtmlComponentWebpackage.artifacts.elementaryComponents.find((comp) => comp.artifactId === 'cubx-input'));
        resolutions['cubx-input'].should.have.property('componentId', 'com.incowia.basic-html-components@0.1.0-SNAPSHOT/cubx-input');
      });
    });
  });
  describe('#resolveMember', function () {
    var manifestCharts;
    var convertedData;
    var member;
    before(function (done) {
      // Get test manifest
      var url = 'resources/com.incowia.lib.chart-library@0.1.0-SNAPSHOT/manifest.webpackage';
      fetch(url).then((res) => res.json())
        .then(function (manifest) {
          manifestCharts = manifest;
          done();
        });
    });

    beforeEach(function (done) {
      // call convertData function
      member = {
        memberId: 'testMember',
        componentId: 'this/bar-chart'
      };
      var promise = new Promise(function (resolve, reject) {
        var convertedDataPromise = window.cubx.bde.bdeDataConverter.resolveMember(member, manifestCharts, 'https://cubbles.world/sandbox/');
        convertedDataPromise.should.be.instanceof(Promise);
        convertedDataPromise.then((convertedData) => {
          resolve(convertedData);
        });
      });
      promise.then(function (data) {
        convertedData = data;
        done();
      });
    });
    it('should be an object', function () {
      convertedData.should.be.an('object');
    });
    it('should have a property member with the correct structure', function () {
      convertedData.should.have.property('member');
      convertedData.member.should.have.property('memberId', member.memberId);
      convertedData.member.should.have.property('componentId');
      convertedData.member.componentId.should.not.equal(member.componentId);
      member.componentId.should.contains(convertedData.member.componentId);
    });
    it('should have a property component with the correct structure', function () {
      convertedData.should.have.property('component');
      convertedData.component.should.have.property('name', 'bar-chart');
      convertedData.component.should.have.property('icon', 'cogs');
      convertedData.component.should.have.property('inports');
      convertedData.component.should.have.property('outports');
      console.log('convertedData.component.inports', JSON.stringify(convertedData.component.inports));
      convertedData.component.inports.should.have.length(4);
      convertedData.component.outports.should.have.length(3);
    });
  });
})();
