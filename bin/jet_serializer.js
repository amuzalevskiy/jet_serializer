var util = require('util'), serializer,
    originalToJSON = Object.prototype.toJSON,
    toString = Object.prototype.toString;

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
            duplicates = [],
            duplicatesRefs = [],
            tmp;

        function avoidRecursion(current) {
            var i, res;
            if ((i = allObjects.indexOf(current)) !== -1) {
                if (duplicates.indexOf(current) === -1) {
                    duplicatesRefs.push({
                        $duplicate: duplicates.length
                    });
                    duplicates.push(current);
                }
            } else {
                if (util.isArray(current)) {
                    allObjects.push(current);
                    for (i = 0; i < current.length; i++) {
                        res = avoidRecursion(current[i]);
                    }
                } else if (typeof current === 'object') {
                    switch (toString.call(current)) {
                        case '[object Date]':
                        case '[object RegExp]':
                        case '[object Error]':
                        case '[object Number]':
                        case '[object String]':
                            break;
                        default:
                            allObjects.push(current);
                            for (i in current) {
                                if (current.hasOwnProperty(i)) {
                                    res = avoidRecursion(current[i]);
                                }
                            }
                    }
                }
            }
        }
        tmp = [object];
        avoidRecursion(object);
        return JSON.stringify({
            $meta: {
                serialize: {
                    me: tmp[0],
                    duplicates: duplicatesRefs.length ? duplicatesRefs : undefined
                }
            }
        }, function singleProp(k, v, isDuplicate) {
            if (v) {
                console.log(toString.call(v), v);
                switch (toString.call(v)) {
                    case '[object Number]':
                    case '[object String]':
                        return v;
                    case '[object Date]':
                        console.log('am in ===================================================================');
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
                    default:
                        console.log('am in ==');
                        if (v.$duplicate !== undefined && !isDuplicate) {
                            return singleProp(k, duplicates[v.$duplicate], true);
                        }

                        var duplicateId = duplicates.indexOf(v);
                        if (duplicateId !== -1) {
                            return {
                                $ref: duplicateId
                            }
                        }

                        var className = serializer.getClassName(v);
                        if (className) {
                            var data = (v.toJSON !== originalToJSON && typeof v.toJSON === 'function') ?
                                v.toJSON() :
                                util._extend({}, v);
                            data.$className = className;
                            return data;
                        }

                        if (v.toJSON !== originalToJSON && typeof v.toJSON === 'function') {
                            console.log('test');
                            return v.toJSON();
                        }
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
        console.log(str);
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
