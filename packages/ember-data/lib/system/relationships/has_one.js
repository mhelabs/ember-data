var get = Ember.get, set = Ember.set, isNone = Ember.isNone;

DS.hasOne = function(type, options) {
  Ember.assert("The type passed to DS.hasOne must be defined", !!type);

  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'hasOne' };

  return Ember.computed(function(key, value) {
    if (arguments.length === 2) {
      return value === undefined ? null : value;
    }

    var data = get(this, 'data');
    var store = get(this, 'store');
    var hasOneRelationship = data[key];
    var id;

    if(isNone(hasOneRelationship)) {
      return null;
    }

    if(hasOneRelationship.clientId){
      return store.recordForReference(hasOneRelationship);
    }

    return store.findById(hasOneRelationship.type, hasOneRelationship.id);
  }).property('data').meta(meta);
};

DS.Model.reopen({
  /** @private */
  init: function() {
    this._super.apply(this, arguments);
    this._hasOneChangesToSync = Ember.OrderedSet.create();
  },

  /** @private */
  hasOneWillChange: Ember.beforeObserver(function(record, key) {
    var child = get(record, key);

    // if the record is the old parent (and is loaded)
    if (child && get(record, 'isLoaded')) {
      var inverseRelationship = this.constructor.inverseFor(key);
      if (isNone(inverseRelationship)) { return; }

      var change = DS.RelationshipChange.createChange(
        get(child, '_reference'),
        get(this, '_reference'),
        get(child, 'store'), {
          key: inverseRelationship.name,
          kind: "hasOne",
          changeType: "remove"
        }
      );
      change.sync();
      this._changesToSync[key] = change;
    }
  }),

  /** @private */
  hasOneDidChange: Ember.immediateObserver(function(record, key) {
    var child = get(record, key);

    // if the record is the new parent (and is loaded)
    if (child && get(record, 'isLoaded')) {
      var inverseRelationship = this.constructor.inverseFor(key);
      if (isNone(inverseRelationship)) { return; }

      var change = DS.RelationshipChange.createChange(
        get(child, '_reference'),
        get(this, '_reference'),
        get(child, 'store'), {
          key: inverseRelationship.name,
          kind: "hasOne",
          changeType: "add"
        }
      );
      change.sync();
    }
  })
});
