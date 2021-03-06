define('Controls/Application/StateReceiver', ['Core/core-extend',
   'Core/Serializer',
   'View/Executor/Utils',
   'UI/Utils'], function(extend, Serializer, Utils, UIUtils) {
   function getDepsFromSerializer(slr) {
      var moduleInfo;
      var deps = {};
      var modules = slr._linksStorage;
      var parts;
      for (var key in modules) {
         if (modules.hasOwnProperty(key)) {
            moduleInfo = modules[key];
            if (moduleInfo.module) {
               parts = Serializer.parseDeclaration(moduleInfo.module);
               deps[parts.name] = true;
            }
         }
      }

      var addDeps = slr._depsStorage || {};
      for (var j in addDeps) {
         if (addDeps.hasOwnProperty(j)) {
            deps[j] = true;
         }
      }

      return deps;
   }

   var SRec = extend.extend({
      receivedStateObjectsArray: null,
      _deserialized: null,
      constructor: function() {
         this._deserialized = {};
         this.receivedStateObjectsArray = {};
      },
      serialize: function() {
         var slr;
         var serializedMap = {};
         var allAdditionalDeps = {};
         var allRecStates = this.receivedStateObjectsArray;
         for (var key in allRecStates) {
            if (allRecStates.hasOwnProperty(key)) {
               var receivedState = allRecStates[key].getState();
               if (receivedState) {
                  serializedMap[key] = receivedState;
               }
            }
         }

         slr = new Serializer();
         var serializedState = JSON.stringify(serializedMap, slr.serialize);
         Utils.Common.componentOptsReArray.forEach(function(re) {
            serializedState = serializedState.replace(re.toFind, re.toReplace);
         });
         serializedState = serializedState.replace(/\\"/g, '\\\\"');
         var addDeps = getDepsFromSerializer(slr);
         for (var dep in addDeps) {
            if (addDeps.hasOwnProperty(dep)) {
               allAdditionalDeps[dep] = true;
            }
         }

         return {
            serialized: serializedState,
            additionalDeps: allAdditionalDeps
         };
      },
      deserialize: function(str) {
         var slr = new Serializer();
         try {
            this._deserialized = JSON.parse(str, slr.deserialize);
         } catch (e) {
            UIUtils.Logger.error('Deserialize', 'Cant\'t deserialize ' + str);
         }
      },

      register: function(key, inst) {
         if (this._deserialized[key]) {
            inst.setState(this._deserialized[key]);
            delete this._deserialized[key];
         }
         if (typeof this.receivedStateObjectsArray[key] !== 'undefined') {
            UIUtils.Logger.warn('SRec::register', 'Try to register instance more than once or duplication of keys happened; current key is "' + key + '"');
         }
         this.receivedStateObjectsArray[key] = inst;
      },

      unregister: function(key) {
         delete this.receivedStateObjectsArray[key];
      }
   });
   return SRec;
});
