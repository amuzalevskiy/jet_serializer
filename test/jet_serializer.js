var assert = require("assert"),
    serializer = require('../bin/jet_serializer');

describe('serializer', function(){

    var cases = [
        {},
        [],
        {number:5, string:"", subObject: {}, null_: null, bool: true, falsy: false},
        [5, "", {}, null],
        "string",
        5.55,
        null,
        new Date(),
        {x: new Date()},
        true,
        false
    ];

    cases.forEach(function (data) {
        it("should serialize and unserialize value - " + JSON.stringify(data), function () {
            var serializedString = serializer.stringify(data);
            var parsed = serializer.parse(serializedString);
            assert.deepEqual(data, parsed);
        });
    });

    it('should restore RegExp\'s', function() {
        var x = /test/i, x2 = {x: /test/m};
        assert.equal('[object RegExp]', Object.prototype.toString.call(serializer.parse(serializer.stringify(x))));
        assert.equal(x.toString(), serializer.parse(serializer.stringify(x)).toString());
        assert.equal('[object RegExp]', Object.prototype.toString.call(serializer.parse(serializer.stringify(x2)).x));
        assert.equal(x2.x.toString(), serializer.parse(serializer.stringify(x2)).x.toString());
    });

    it('should serialize and unserialize object with recursive ref', function() {
        var x = {number:5, string:"", subObject: {}, null_: null}, xRes;
        x.x = x;
        x.x2 = x;
        xRes = serializer.parse(serializer.stringify(x));
        assert.strictEqual(xRes, xRes.x);
        assert.strictEqual(xRes.x, xRes.x2);
    });

    it('should ignore functions in object', function() {
        var x = {fn: function (){}, x: 5};
        assert.deepEqual({x: 5}, serializer.parse(serializer.stringify(x)));
    });

    it('should replace functions to null in array', function() {
        var x = [5, "", {}, null, function () {}, 3];
        assert.deepEqual([5, "", {}, null, null, 3], serializer.parse(serializer.stringify(x)));
    });

    it('should call toJSON', function() {
        var xSer = {number: 5},
            x = {toJSON: function () {return xSer;}};
        assert.deepEqual(serializer.stringify(xSer), serializer.stringify(x));
    });

    it('should call toJSON for inner objects', function() {
        var xSer = {number: 5},
            x = {deep: {toJSON: function () {return xSer;}}};
        assert.deepEqual(serializer.stringify({deep: xSer}), serializer.stringify(x));
    });

    it('should restore classes', function() {
        function d () {
            this.x = 5;
        }

        serializer.registerClass('d', d);

        var x = new d(),
            xRestored = serializer.parse(serializer.stringify(x));
        assert(xRestored instanceof d);
        assert.equal(xRestored.x, x.x);
    });

    it('should call $wakeup for objects', function() {
        function dw () {}
        dw.prototype.$wakeup = function () {this.wakedUp = true};
        serializer.registerClass('dw', dw);
        var x = new dw(),
            xRestored = serializer.parse(serializer.stringify(x));
        assert(xRestored instanceof dw);
        assert(xRestored.wakedUp, true);
    });

    it('should not change initial object', function() {
        function d () {
            this.x = 5;
        }

        serializer.registerClass('d', d);

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

        serializer.stringify(x);

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

        assert.equal(Object.keys(x).length,  4);
        assert.equal(Object.keys(y).length,  4);
        assert.equal(Object.keys(z).length,  4);
    });

    it('should restore duplicate class instances', function() {
        function d () {
            this.x = 5;
        }

        serializer.registerClass('d', d);

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

        var xRestored = serializer.parse(serializer.stringify(x));
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
});
