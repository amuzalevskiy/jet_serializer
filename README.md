# jetSerializer
Extended serializer for Javascript

## Features of JetSerializer:
- It could pack objects with recursion
- lt will not paste identical objects twice and will resolve them correctly
- It could pack Dates and RegExp's
- It can restore class instanses
- It covered with tests

### Upcoming features
- Support YML format
- Generated string representation is human readable/editable
- It works both on client and server side
- It supprots clientside loaders (e.g. requireJs)
- It can be plugged

## Basic usage
### On server
```javascript
var jetSerializer = require('jet-serializer'),
    Model = require('model');

jetSerializer.registerClass('Model', Model);

var x = new Model(),
    xSer = jetSerializer.stringify(x);

console.log(xSer);

var xRestored = jetSerializer.parse(xSer);
console.log(xRestored);
```

### Running tests
Install mocha (`npm install -g mocha`) and type `npm test` in console
