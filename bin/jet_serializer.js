var util = require('util'), serializer;

module.exports = serializer = {
    /**
     * Class names store
     * @type {{}}
     */
    classes: {},

    /**
     * Serializes object to string
     *
     * @param object {*}
     * @param space {string=} optional argument to add spaces into output
     * @returns {string}
     */
    stringify: function (object, space) {
        var allObjects = [],
            refs = [],
            duplicates = [],
            tmp;

        function avoidRecursion(current, key, parent) {
            var i, iDup, res;
            if ((i = allObjects.indexOf(current)) !== -1) {
                if ((iDup = duplicates.indexOf(current)) === -1) {
                    iDup = duplicates.length;
                    duplicates.push(current);
                    parent[key] = {$ref: iDup};
                    refs[i][0][refs[i][1]] = {$ref: iDup};
                } else {
                    parent[key] = {$ref: iDup};
                }
            } else {
                if (util.isArray(current)) {
                    allObjects.push(current);
                    refs.push([parent, key]);
                    for (i = 0; i < current.length; i++) {
                        res = avoidRecursion(current[i], i, current);
                    }
                } else if (typeof current === 'object') {
                    allObjects.push(current);
                    refs.push([parent, key]);
                    for (i in current) {
                        if (current.hasOwnProperty(i)) {
                            res = avoidRecursion(current[i], i, current);
                        }
                    }
                }
            }
        }
        tmp = [object];
        avoidRecursion(object, 0 , tmp);
        return JSON.stringify({
            $meta: {
                serialize: {
                    me: tmp[0],
                    duplicates: duplicates.length ? duplicates : undefined
                }
            }
        }, function (k, v) {
            var className = serializer.getClassName(v);
            if (className) {
                var data = typeof v.toJSON === 'function' ? v.toJSON() : util._extend({}, v);
                data.$className = className;
                return data;
            }
            if (v) {
                if (typeof v.toJSON === 'function') {
                    return v.toJSON();
                }
                switch (Object.prototype.toString.call(v)) {
                    case '[object Date]':
                        return {
                            $className: 'Date',
                            value: v.toISOString()
                        };
                    case '[object RegExp]':
                        return {
                            $className: 'RegExp',
                            source: v.source,
                            flags: v.toString().match(/[gim]*$/)[0]
                        };
                    case '[object Error]':
                        return {
                            $className: 'Error',
                            name: v.name,
                            message: v.message
                        };
                }
            }
            return v;
        }, space);
    },

    /**
     * Converts serialized string to object
     *
     * @param str {string}
     * @returns {*}
     */
    parse: function (str) {
        // console.log(str);
        var first = JSON.parse(str), me, duplicates, tmp;
        if (!first.$meta && !first.$meta.serialize) {
            throw new Error('Invalid argument passed');
        }
        me = first.$meta.serialize.me;
        duplicates = first.$meta.serialize.duplicates || [];
        function resolveRecursion(current, key, parent) {
            var i, tmp;
            if (current && current.hasOwnProperty('$ref')) {
                parent[key] = duplicates[current.$ref];
            } else {
                if (util.isArray(current)) {
                    for (i = 0; i < current.length; i++) {
                        resolveRecursion(current[i], i, current);
                    }
                } else if (typeof current == 'object' && current !== null) {
                    if (current.$className) {
                        var className = current.$className,
                            ctor;
                        delete current.$className;
                        switch (className) {
                            case 'Date':
                                current = parent[key] = new Date(current.value);
                                break;
                            case 'RegExp':
                                current = parent[key] = new RegExp(current.source, current.flags);
                                break;
                            case 'Error':
                                tmp = new Error(current.message);
                                tmp.name = current.name;
                                current = parent[key] = tmp;
                                break;
                            default:
                                ctor = serializer.getConstructor(className);
                                current = parent[key] = util._extend(Object.create(ctor.prototype, {
                                    constructor: {
                                        value: ctor,
                                        enumerable: false,
                                        writable: true,
                                        configurable: true
                                    }
                                }), current);
                                break;
                        }
                    }
                    for (i in current) {
                        if (current.hasOwnProperty(i)) {
                            resolveRecursion(current[i], i, current);
                        }
                    }
                    if (typeof current.$wakeup === 'function') {
                        current.$wakeup();
                    }
                }
            }
        }
        resolveRecursion(duplicates);
        tmp = [me];
        resolveRecursion(me, 0, tmp);
        return tmp[0];
    },

    /**
     * Register class to be able stringify it
     *
     * @param name {string}
     * @param constructor {function}
     */
    registerClass: function (name, constructor) {
        this.classes[name] = constructor;
    },

    /**
     * Returns class name for passed instance
     *
     * @param instance
     * @returns {string|undefined}
     */
    getClassName: function (instance) {
        for (var name in this.classes) {
            if (instance instanceof this.classes[name]) {
                return name;
            }
        }
    },

    /**
     * Return constructor by class name
     *
     * @param name {string}
     * @returns {function}
     */
    getConstructor: function (name) {
        return this.classes[name];
    }
};
