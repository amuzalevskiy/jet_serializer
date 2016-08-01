# jetSerializer - extended serializer for Javascript
The goal of this module is to cover most often issues with `JSON.stringify` and `JSON.parse` such as:
- recursion in objects
- packs Dates, RegExp's, Errors
- can restore class instanses
- behaviour with sparse arrays (`undefined` becomes `null`)

```javascript
var JetSerializer = require('jet_serializer');
var serializedString = JetSerializer.stringify(value);
var xRestored = JetSerializer.parse(serializedString);
console.log(xRestored);
```

Please overview [tests to find a code samples](https://github.com/amuzalevskiy/jet_serializer/blob/master/test/jet_serializer.js)

## Options
| Option                 | Default   | Description                                                  |
|:-----------------------|:----------|:-------------------------------------------------------------|
| `support`              |           | Feature flags container                                      |
| `support.recursion`    | `true`    | Fixes recursive links in objects. Has huge perfomance impact |
| `support.native`       | `true`    | Support native objects, such as dates, regexp's, errors      |
| `support.sparse_arrays`| `true`    | Fix sparse arrays gaps fullfillment with `null`              |
| `support.classes`      | `false`   | Restore class instances                                      |
| `format`               | `false`   | Generate formatted source, useful for debug                  |
| `resolveClass`         | `null`    | function to find a class instance by string class id         |
| `getClassId`           | `null`    | function to find a class instance by string class id         |
| `async`                | `false`   | enables async mode, usefull in environments like requireJS   |

## Use with classes
Following options should be provided to stringify and restore class instances:
```javascript
var JetSerializer = require('jet_serializer');
var sr = new JetSerializer({
    support: {
        classes: true
    },
    resolveClass: function(id) { // function resolves identifier to class implementation
        return window[id];
    },
    getClassId: function(ctor) { // function returns class name for implementation
        return ctor.name;
    }
});
function TestClass() {};
var x = new TestClass();
x.valueToStore = 'stored';
var serializedString = sr.stringify(x);
var xRestored = sr.parse(serializedString);
console.log(xRestored instanceof TestClass); // true
console.log(xRestored.valueToStore); // "stored"
```

Define `wakeUp()` to specify logic to run during deserialization.

Serializer creates all instances at first, then runs wakeUp function on all objects where specified.

Please note that the order of wakeUp calls is not guaranteed because of recursion support.

```javascript
function Wakeable () {}
Wakeable.prototype.wakeUp = function () {this.wakedUp = true};
var x = new Wakeable(),
    xRestored = sr.parse(sr.stringify(x));
assert(xRestored.wakedUp, true);
```

## Use with classes in async mode (REquireJS like environments)


## Running tests
Type `npm install, npm test` in console

## License
The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
