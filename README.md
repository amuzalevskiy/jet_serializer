# jetSerializer - extended serializer for Javascript
The goal of this module is to cover most often issues with `JSON.stringify` and `JSON.parse` such as:
- recursion in objects
- packs Dates, RegExp's, Errors
- can restore class instanses

```javascript
var serializer = require('jet_serializer');
var serializedString = serializer.stringify(value);
var xRestored = serializer.parse(serializedString);
console.log(xRestored);
```

Please overview [tests to find a code samples](https://github.com/amuzalevskiy/jet_serializer/blob/master/test/jet_serializer.js)

### Running tests
Type `npm install, npm test` in console

## License
The MIT License (MIT)

Copyright (c) 2015 Andrii Muzalevskyi

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

## Change log
- 0.1.6 (31.07.2016) - First stable release
- 0.1.5 (24.04.2015) - First release
