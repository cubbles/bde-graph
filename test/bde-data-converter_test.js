(function () {
  'use strict';
  describe('bde-data-converter', function () {
    describe('basics', function () {
      it('bde-data-converter should be exists', function () {
        expect(window.cubx.bde.bdeDataConverter).to.be.exists;
      });
      it('bde-data-converter should have property "convertArtifact"', function () {
        expect(window.cubx.bde.bdeDataConverter).to.be.exists;
        window.cubx.bde.bdeDataConverter.should.have.property('convertArtifact');
      });
      it('bde-data-converter should have method "convertArtifact"', function () {
        window.cubx.bde.bdeDataConverter.convertArtifact.should.be.a('function');
      });
      it('bde-data-converter should have a property compoundIcon="cogs"', function () {
        window.cubx.bde.bdeDataConverter.should.have.ownProperty('compoundIcon', 'cogs');
      });
      it('bde-data-converter should have a property elementaryIcon="cog"', function () {
        window.cubx.bde.bdeDataConverter.should.have.ownProperty('elementaryIcon', 'cog');
      });
    });
  });
  describe('convert webpackage', function () {
    describe('minimal webpackage', function () {
      var manifestCharts;
      before(function (done) {
        // Get test manifest
        var url = 'resources/minimal/manifest.webpackage';
        fetch(url).then((res) => res.json())
          .then(function (manifest) {
            manifestCharts = manifest;
            console.log(JSON.stringify(manifestCharts));
            done();
          });
      });
      after(function () {
      });
      var convertedData;
      beforeEach(function (done) {
        // call convertData function
        var promise = new Promise(function (resolve, reject) {
          var convertedDataPromise = window.cubx.bde.bdeDataConverter.convertArtifact(manifestCharts, 'test-compound', 'https://cubbles.world/sandbox/');
          convertedDataPromise.should.be.instanceof(Promise);
          convertedDataPromise.then((convertedData) => {
            resolve(convertedData);
          });
        });
        promise.then(function (data) {
          convertedData = data;
          console.log(JSON.stringify(convertedData));
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
            console.log(JSON.stringify(manifestCharts));
            done();
          });
      });
      after(function () {
      });
      var convertedData;
      var artifact;
      beforeEach(function (done) {
        // call convertData function
        var promise = new Promise(function (resolve, reject) {
          var convertedDataPromise = window.cubx.bde.bdeDataConverter.convertArtifact(manifestCharts, 'bar-chart', 'https://cubbles.world/sandbox/');
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
        console.log('ouports', JSON.stringify(component.outports));
        component.inports[ 0 ].should.have.property('name', 'dataColumns');
        component.inports[ 0 ].should.have.property('type', 'object');
        component.inports[ 1 ].should.have.property('name', 'xLabels');
        component.inports[ 1 ].should.have.property('type', 'object');
        component.inports[ 2 ].should.have.property('name', 'testInputOutput');
        component.inports[ 2 ].should.have.property('type', 'string');
        component.inports[ 3 ].should.have.property('name', 'test');
        component.inports[ 3 ].should.have.property('type', 'object');
        component.outports.should.have.length('3');
        // [{"name":"testInputOutput","type":"string"},{"name":"testOutput","type":"number"},{"name":"test","type":"object"}]
        component.outports[ 0 ].should.have.property('name', 'testInputOutput');
        component.outports[ 0 ].should.have.property('type', 'string');
        component.outports[ 1 ].should.have.property('name', 'testOutput');
        component.outports[ 1 ].should.have.property('type', 'number');
        component.outports[ 2 ].should.have.property('name', 'test');
        component.outports[ 2 ].should.have.property('type', 'object');
      });
      it('should the second element in components should be right structure for elementary components', function () {
        console.log(JSON.stringify(convertedData));
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
    });
  });
})();
