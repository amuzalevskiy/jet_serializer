var assert = require("assert"),
    _ = require("underscore"),
    Jet_Serializer = require('../bin/jet_serializer');

describe('Jet_Serializer', function(){

    it('should serialize and unserialize empty object', function() {
        var x = {};
        assert.deepEqual(x, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
    });

    it('should serialize and unserialize empty array', function() {
        var x = [];
        assert.deepEqual(x, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
    });

    it('should serialize and unserialize object', function() {
        var x = {number:5, string:"", subObject: {}, null_: null};
        assert.deepEqual(x, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
    });

    it('should restore dates', function() {
        var x = new Date(), x2 = {x: new Date()};
        assert.equal(x, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
        assert.deepEqual(x2, Jet_Serializer.parse(Jet_Serializer.stringify(x2)));
    });

    it('should restore RegExp\'s', function() {
        var x = /test/i, x2 = {x: /test/m};
        assert.equal(x, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
        assert.deepEqual(x2, Jet_Serializer.parse(Jet_Serializer.stringify(x2)));
    });

    it('should serialize and unserialize object with recursive ref', function() {
        var x = {number:5, string:"", subObject: {}, null_: null}, xRes;
        x.x = x;
        x.x2 = x;
        xRes = Jet_Serializer.parse(Jet_Serializer.stringify(x));
        assert.strictEqual(xRes, xRes.x);
        assert.strictEqual(xRes.x, xRes.x2);
    });

    it('should serialize and unserialize array', function() {
        var x = [5, "", {}, null];
        assert.deepEqual(x, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
    });

    it('should ignore functions in object', function() {
        var x = {fn: function (){}, x: 5};
        assert.deepEqual({x: 5}, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
    });
    it('should replace functions to null in array', function() {
        var x = [5, "", {}, null, function () {}, 3];
        assert.deepEqual([5, "", {}, null, null, 3], Jet_Serializer.parse(Jet_Serializer.stringify(x)));
    });

    it('should call toJSON', function() {
        var xSer = {number: 5},
            x = {toJSON: function () {return xSer;}};
        assert.deepEqual(Jet_Serializer.stringify(xSer), Jet_Serializer.stringify(x));
    });

    it('should call toJSON for inner objects', function() {
        var xSer = {number: 5},
            x = {deep: {toJSON: function () {return xSer;}}};
        assert.deepEqual(Jet_Serializer.stringify({deep: xSer}), Jet_Serializer.stringify(x));
    });

    it('should restore classes', function() {
        function d () {
            this.x = 5;
        }

        Jet_Serializer.registerClass('d', d);

        var x = new d(),
            xRestored = Jet_Serializer.parse(Jet_Serializer.stringify(x));
        assert(xRestored instanceof d);
        assert.equal(xRestored.x, x.x);
    });

    it('should call $wakeup for objects', function() {
        function dw () {}
        dw.prototype.$wakeup = function () {this.wakedUp = true};
        Jet_Serializer.registerClass('dw', dw);
        var x = new dw(),
            xRestored = Jet_Serializer.parse(Jet_Serializer.stringify(x));
        assert(xRestored instanceof dw);
        assert(xRestored.wakedUp, true);
    });

    it('should not change initial object', function() {
        function d () {
            this.x = 5;
        }

        Jet_Serializer.registerClass('d', d);

        var x = new d(),
            y = new d(),
            z = new d();

        x.x = x;
        x.y = y;
        x.z = z;
        x.name = "x";

        y.x = x;
        y.y = y;
        y.z = z;
        y.name = "y";

        z.x = x;
        z.y = y;
        z.z = z;
        z.name = "z";

        Jet_Serializer.stringify(x);

        assert.strictEqual(x.x, x);
        assert.strictEqual(x.y, y);
        assert.strictEqual(x.z, z);

        assert.strictEqual(x.x.x, x);
        assert.strictEqual(x.x.y, y);
        assert.strictEqual(x.x.z, z);

        assert.strictEqual(x.y.x, x);
        assert.strictEqual(x.y.y, y);
        assert.strictEqual(x.y.z, z);

        assert.strictEqual(x.z.x, x);
        assert.strictEqual(x.z.y, y);
        assert.strictEqual(x.z.z, z);

        assert.equal(x.x.name, 'x');
        assert.equal(x.y.name, 'y');
        assert.equal(x.z.name, 'z');

        assert.equal(x.x.x.name, 'x');
        assert.equal(x.x.y.name, 'y');
        assert.equal(x.x.z.name, 'z');

        assert.equal(x.y.x.name, 'x');
        assert.equal(x.y.y.name, 'y');
        assert.equal(x.y.z.name, 'z');

        assert.equal(x.z.x.name, 'x');
        assert.equal(x.z.y.name, 'y');
        assert.equal(x.z.z.name, 'z');
    });

    it('should restore duplicate classes', function() {
        function d () {
            this.x = 5;
        }

        Jet_Serializer.registerClass('d', d);

        var x = new d(),
            y = new d(),
            z = new d();

        x.x = x;
        x.y = y;
        x.z = z;

        y.x = x;
        y.y = y;
        y.z = z;

        z.x = x;
        z.y = y;
        z.z = z;

        var xRestored = Jet_Serializer.parse(Jet_Serializer.stringify(x));
        assert(xRestored instanceof d);

        assert.strictEqual(xRestored.x, xRestored.x.x);
        assert.strictEqual(xRestored.x, xRestored.y.x);
        assert.strictEqual(xRestored.x, xRestored.z.x);

        assert.strictEqual(xRestored.y, xRestored.x.y);
        assert.strictEqual(xRestored.y, xRestored.y.y);
        assert.strictEqual(xRestored.y, xRestored.z.y);

        assert.strictEqual(xRestored.z, xRestored.x.z);
        assert.strictEqual(xRestored.z, xRestored.y.z);
        assert.strictEqual(xRestored.z, xRestored.z.z);
    });


    it('should restore dates', function() {
        var x = new Date(), x2 = {x: new Date()};
        assert.equal(x, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
        //assert.deepEqual(x2, Jet_Serializer.parse(Jet_Serializer.stringify(x2)));
    });
});
