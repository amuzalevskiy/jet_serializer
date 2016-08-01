var util = require('util'),
    serializer,
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
            duplicatesRefs = [];

        function searchForDuplicates(current) {
            var i, key;
            if (current === null) {
                return;
            }
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
                        searchForDuplicates(current[i]);
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
                            for (key in current) {
                                if (current.hasOwnProperty(key)) {
                                    searchForDuplicates(current[key]);
                                }
                            }
                    }
                }
            }
        }

        function packClassInstance(v) {
            var className = serializer.getClassName(v);
            if (className) {
                v = (v.toJSON !== originalToJSON && typeof v.toJSON === 'function') ?
                    v.toJSON() :
                    util._extend({}, v);
                v.$className = className;
            } else if (v.toJSON !== originalToJSON && typeof v.toJSON === 'function') {
                v = v.toJSON();
            }
            return v;
        }

        searchForDuplicates([object]);

        var origDateToJSON = Date.prototype.toJSON,
            origRegExpToJSON = RegExp.prototype.toJSON,
            origErrorToJSON = Error.prototype.toJSON;

        Date.prototype.toJSON = function () {
            return {
                $className: 'Date',
                value: this.toISOString()
            }
        };
        RegExp.prototype.toJSON = function () {
            return {
                $className: 'RegExp',
                source: this.source,
                flags: this.toString().match(/[gim]*$/)[0]
            };
        };
        Error.prototype.toJSON = function () {
            return {
                $className: 'Error',
                name: this.name,
                message: this.message
            };
        };

        var result = JSON.stringify({
            main: object,
            $duplicates: duplicatesRefs.length ? duplicatesRefs : undefined
        }, function singleProp(k, v) {
            if (v && v !== null && v !== true && v !== false) {
                switch (toString.call(v)) {
                    case '[object Number]':
                    case '[object String]':
                    default:
                        if (v.$duplicate !== undefined) {
                            v = packClassInstance(duplicates[v.$duplicate]);
                            break;
                        }

                        var duplicateId = duplicates.indexOf(v);
                        if (duplicateId !== -1) {
                            return {
                                $ref: duplicateId
                            }
                        }

                        v = packClassInstance(v);
                }
            }
            return v;
        }, space);

        Date.prototype.toJSON = origDateToJSON;
        RegExp.prototype.toJSON = origRegExpToJSON;
        Error.prototype.toJSON = origErrorToJSON;

        return result;
    },

    /**
     * Converts serialized string to object
     *
     * @param str {string}
     * @returns {*}
     */
    parse: function (str) {
        var rawObject = JSON.parse(str), main, duplicates, tmp, resolvedObj = [];
        if (rawObject.main === void 0) {
            throw new Error('Invalid argument passed');
        }
        main = rawObject.main;
        duplicates = rawObject.$duplicates || [];

        function buildInstance(className, current) {
            var ctor = serializer.getConstructor(className);
            if (!ctor) {
                throw new Error("Cannot find constructor for class name `" + className +"`");
            }
            delete current.$className;
            return util._extend(Object.create(ctor.prototype, {
                constructor: {
                    value: ctor,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            }), current);
        }

        function resolveRecursion(current, key, parent) {
            var i, tmp;
            switch (toString.call(current)) {
                case '[object Number]':
                case '[object String]':
                    return;
            }
            if (current && current.hasOwnProperty('$ref')) {
                parent[key] = duplicates[current.$ref];
            } else {
                resolvedObj.push(current);
                if (util.isArray(current)) {
                    for (i = 0; i < current.length; i++) {
                        if (resolvedObj.indexOf(current[i]) === -1) {
                            resolveRecursion(current[i], i, current);
                        }
                    }
                } else if (typeof current == 'object' && current !== null) {
                    if (current.$className) {
                        var className = current.$className,
                            ctor;
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
                                if (ctor) {
                                    current = parent[key] = buildInstance(className, current);
                                }

                                for (i in current) {
                                    if (current.hasOwnProperty(i)) {
                                        if (resolvedObj.indexOf(current[i]) === -1) {
                                            resolveRecursion(current[i], i, current);
                                        }
                                    }
                                }

                                break;
                        }
                    } else {
                        for (i in current) {
                            if (current.hasOwnProperty(i)) {
                                if (resolvedObj.indexOf(current[i]) === -1) {
                                    resolveRecursion(current[i], i, current);
                                }
                            }
                        }
                    }
                    if (typeof current.$wakeup === 'function') {
                        current.$wakeup();
                    }
                }
            }
        }

        for (var i = 0; i < duplicates.length; i++) {
            var duplicate = duplicates[i];
            if (duplicate.$className) {
                duplicates[i] = buildInstance(duplicate.$className, duplicate);
            }
        }
        resolveRecursion(duplicates);
        tmp = [main];
        resolveRecursion(main, 0, tmp);
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
