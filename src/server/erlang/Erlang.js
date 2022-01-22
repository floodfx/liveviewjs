// //-*-Mode:javascript;coding:utf-8;tab-width:4;c-basic-offset:4;indent-tabs-mode:()-*-
// // ex: set ft=javascript fenc=utf-8 sts=4 ts=4 sw=4 et nomod:
// //
// // MIT License
// //
// // Copyright (c) 2014-2020 Michael Truog <mjtruog at protonmail dot com>
// //
// // Permission is hereby granted, free of charge, to any person obtaining a
// // copy of this software and associated documentation files (the "Software"),
// // to deal in the Software without restriction, including without limitation
// // the rights to use, copy, modify, merge, publish, distribute, sublicense,
// // and/or sell copies of the Software, and to permit persons to whom the
// // Software is furnished to do so, subject to the following conditions:
// //
// // The above copyright notice and this permission notice shall be included in
// // all copies or substantial portions of the Software.
// //
// // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// // FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// // DEALINGS IN THE SOFTWARE.
// //

// exports.Erlang = new function() {
//   var Erlang = this; // namespace

//   var zlib = require('zlib');

//   // tag values here http://www.erlang.org/doc/apps/erts/erl_ext_dist.html
//   var TAG_VERSION = 131;
//   var TAG_COMPRESSED_ZLIB = 80;
//   var TAG_NEW_FLOAT_EXT = 70;
//   var TAG_BIT_BINARY_EXT = 77;
//   var TAG_ATOM_CACHE_REF = 78;
//   var TAG_NEW_PID_EXT = 88;
//   var TAG_NEW_PORT_EXT = 89;
//   var TAG_NEWER_REFERENCE_EXT = 90;
//   var TAG_SMALL_INTEGER_EXT = 97;
//   var TAG_INTEGER_EXT = 98;
//   var TAG_FLOAT_EXT = 99;
//   var TAG_ATOM_EXT = 100;
//   var TAG_REFERENCE_EXT = 101;
//   var TAG_PORT_EXT = 102;
//   var TAG_PID_EXT = 103;
//   var TAG_SMALL_TUPLE_EXT = 104;
//   var TAG_LARGE_TUPLE_EXT = 105;
//   var TAG_NIL_EXT = 106;
//   var TAG_STRING_EXT = 107;
//   var TAG_LIST_EXT = 108;
//   var TAG_BINARY_EXT = 109;
//   var TAG_SMALL_BIG_EXT = 110;
//   var TAG_LARGE_BIG_EXT = 111;
//   var TAG_NEW_FUN_EXT = 112;
//   var TAG_EXPORT_EXT = 113;
//   var TAG_NEW_REFERENCE_EXT = 114;
//   var TAG_SMALL_ATOM_EXT = 115;
//   var TAG_MAP_EXT = 116;
//   var TAG_FUN_EXT = 117;
//   var TAG_ATOM_UTF8_EXT = 118;
//   var TAG_SMALL_ATOM_UTF8_EXT = 119;

//   var nodejs_version = process.versions['node'].split('.').map(function (s) {
//       return parseInt(s);
//   });
//   Erlang.nodejs_version_after = function nodejs_version_after (s, include) {
//       var v = s.split('.').map(function (s) {
//           return parseInt(s);
//       });
//       for (var i = 0; i < v.length; i++) {
//           if (nodejs_version[i] > v[i]) {
//               return true;
//           }
//           if (nodejs_version[i] < v[i]) {
//               return false;
//           }
//       }
//       return include;
//   };
//   var toNativeString = {}.toString;
//   var bufferFrom;
//   var bufferAlloc;
//   if (Erlang.nodejs_version_after('5.10.0',true)) {
//       bufferFrom = Buffer.from;
//       bufferAlloc = Buffer.alloc;
//   }
//   else {
//       bufferFrom = Buffer;
//       bufferAlloc = Buffer;
//   }
//   var packUint16 = function packUint16 (value, i, buffer) { // big endian
//       buffer[i] = (value >>> 8) & 0xff;
//       buffer[i + 1] = value & 0xff;
//       return buffer;
//   };
//   var packUint32 = function packUint32 (value, i, buffer) { // big endian
//       buffer[i] = (value >>> 24) & 0xff;
//       buffer[i + 1] = (value >>> 16) & 0xff;
//       buffer[i + 2] = (value >>> 8) & 0xff;
//       buffer[i + 3] = value & 0xff;
//       return buffer;
//   };
//   var unpackUint16 = function unpackUint16 (i, buffer) { // big endian
//       return (buffer[i] << 8) |
//              buffer[i + 1];
//   };
//   var unpackUint32 = function unpackUint32 (i, buffer) { // big endian
//       return (buffer[i] << 24) |
//              (buffer[i + 1] << 16) |
//              (buffer[i + 2] << 8) |
//              buffer[i + 3];
//   };

//   // Exception objects listed alphabetically

//   var InputException = function InputException (message) {
//       var error = new Error(message);
//       error.name = 'InputException';
//       this.message = error.message;
//       if (error.stack) {
//           this.stack = error.stack;
//       }
//   }
//   InputException.prototype = Object.create(Error.prototype, {
//       name: { value: 'InputException' }
//   });
//   var OutputException = function OutputException (message) {
//       var error = new Error(message);
//       error.name = 'OutputException';
//       this.message = error.message;
//       if (error.stack) {
//           this.stack = error.stack;
//       }
//   }
//   OutputException.prototype = Object.create(Error.prototype, {
//       name: { value: 'OutputException' }
//   });
//   var ParseException = function ParseException (message) {
//       var error = new Error(message);
//       error.name = 'ParseException';
//       this.message = error.message;
//       if (error.stack) {
//           this.stack = error.stack;
//       }
//   }
//   ParseException.prototype = Object.create(Error.prototype, {
//       name: { value: 'ParseException' }
//   });

//   var compress = function(buffer_in, level, callback) {
//       var o = zlib.createDeflate({level: level});
//       var buffers_out = [];
//       o.on('error', function(err) {
//           o.removeAllListeners();
//           callback(new OutputException(err.toString()), undefined);
//       });
//       o.on('data', function(chunk) {
//           buffers_out.push(chunk);
//       });
//       o.on('end', function() {
//           o.removeAllListeners();
//           var buffer_out = Buffer.concat(buffers_out);
//           callback(undefined, buffer_out);
//       });
//       o.write(buffer_in);
//       o.end();
//   };
//   var uncompress = function(buffer_in, callback) {
//       zlib.inflate(buffer_in, function(err, buffer_out) {
//           if (err) {
//               callback(new ParseException(err.toString()), undefined);
//           }
//           else {
//               callback(undefined, buffer_out);
//           }
//       });
//   };

//   //  Erlang term objects listed alphabetically

//   Erlang.OtpErlangAtom = function OtpErlangAtom (value, utf8) {
//       this.value = value;
//       this.utf8 = typeof utf8 !== 'undefined' ? utf8 : false;
//   };
//   Erlang.OtpErlangAtom.prototype.binary = function() {
//       if (typeof this.value == 'number') {
//           var buffer = new bufferAlloc(2);
//           buffer[0] = TAG_ATOM_CACHE_REF;
//           buffer[1] = this.value;
//           return buffer;
//       }
//       else if (typeof this.value == 'string') {
//           var length = this.value.length;
//           if (this.utf8) {
//               if (length <= 255) {
//                   var buffer = new bufferAlloc(2 + length);
//                   buffer[0] = TAG_SMALL_ATOM_UTF8_EXT;
//                   buffer[1] = length;
//                   buffer.write(this.value, 2, length, 'binary');
//                   return buffer;
//               }
//               else if (length <= 65535) {
//                   var buffer = new bufferAlloc(3 + length);
//                   buffer[0] = TAG_ATOM_UTF8_EXT;
//                   packUint16(length, 1, buffer);
//                   buffer.write(this.value, 3, length, 'binary');
//                   return buffer;
//               }
//               else {
//                   throw new OutputException('uint16 overflow');
//               }
//           }
//           else {
//               if (length <= 255) {
//                   var buffer = new bufferAlloc(2 + length);
//                   buffer[0] = TAG_SMALL_ATOM_EXT;
//                   buffer[1] = length;
//                   buffer.write(this.value, 2, length, 'binary');
//                   return buffer;
//               }
//               else if (length <= 65535) {
//                   var buffer = new bufferAlloc(3 + length);
//                   buffer[0] = TAG_ATOM_EXT;
//                   packUint16(length, 1, buffer);
//                   buffer.write(this.value, 3, length, 'binary');
//                   return buffer;
//               }
//               else {
//                   throw new OutputException('uint16 overflow');
//               }
//           }
//       }
//       else {
//           throw new OutputException('unknown atom type');
//       }
//   };
//   Erlang.OtpErlangAtom.prototype.toString = function() {
//       return 'OtpErlangAtom(' + this.value + ',' + this.utf8 + ')';
//   };

//   Erlang.OtpErlangAtomLarge = function OtpErlangAtomLarge (value, utf8) {
//       this.value = value;
//       this.utf8 = typeof utf8 !== 'undefined' ? utf8 : false;
//   };
//   Erlang.OtpErlangAtomLarge.prototype.binary = function() {
//       if (typeof this.value == 'string') {
//           var length = this.value.length;
//           if (this.utf8) {
//               if (length <= 65535) {
//                   var buffer = new bufferAlloc(3 + length);
//                   buffer[0] = TAG_ATOM_UTF8_EXT;
//                   packUint16(length, 1, buffer);
//                   buffer.write(this.value, 3, length, 'binary');
//                   return buffer;
//               }
//               else {
//                   throw new OutputException('uint16 overflow');
//               }
//           }
//           else {
//               if (length <= 65535) {
//                   var buffer = new bufferAlloc(3 + length);
//                   buffer[0] = TAG_ATOM_EXT;
//                   packUint16(length, 1, buffer);
//                   buffer.write(this.value, 3, length, 'binary');
//                   return buffer;
//               }
//               else {
//                   throw new OutputException('uint16 overflow');
//               }
//           }
//       }
//       else {
//           throw new OutputException('unknown atom type');
//       }
//   };
//   Erlang.OtpErlangAtomLarge.prototype.toString = function() {
//       return 'OtpErlangAtomLarge(' + this.value + ',' + this.utf8 + ')';
//   };

//   Erlang.OtpErlangBinary = function OtpErlangBinary (value, bits) {
//       this.value = value;
//       this.bits = typeof bits !== 'undefined' ? bits : 8;
//   };
//   Erlang.OtpErlangBinary.prototype.binary = function() {
//       if (typeof this.value == 'string') {
//           var length = this.value.length;
//           if (length > 4294967295) {
//               throw new OutputException('uint32 overflow');
//           }
//           else if (this.bits != 8) {
//               var buffer = new bufferAlloc(6 + length);
//               buffer[0] = TAG_BIT_BINARY_EXT;
//               packUint32(length, 1, buffer);
//               buffer[5] = this.bits;
//               buffer.write(this.value, 6, length, 'binary');
//               return buffer;
//           }
//           else {
//               var buffer = new bufferAlloc(5 + length);
//               buffer[0] = TAG_BINARY_EXT;
//               packUint32(length, 1, buffer);
//               buffer.write(this.value, 5, length, 'binary');
//               return buffer;
//           }
//       }
//       else if (Buffer.isBuffer(this.value)) {
//           var length = this.value.length;
//           if (length > 4294967295) {
//               throw new OutputException('uint32 overflow');
//           }
//           else if (this.bits != 8) {
//               var buffer = new bufferAlloc(6 + length);
//               buffer[0] = TAG_BIT_BINARY_EXT;
//               packUint32(length, 1, buffer);
//               buffer[5] = this.bits;
//               this.value.copy(buffer, 6);
//               return buffer;
//           }
//           else {
//               var buffer = new bufferAlloc(5 + length);
//               buffer[0] = TAG_BINARY_EXT;
//               packUint32(length, 1, buffer);
//               this.value.copy(buffer, 5);
//               return buffer;
//           }
//       }
//       else {
//           throw new OutputException('unknown binary type');
//       }
//   };
//   Erlang.OtpErlangBinary.prototype.toString = function() {
//       return 'OtpErlangBinary(' + (typeof this.value) + ',' + this.bits + ')';
//   };

//   Erlang.OtpErlangFunction = function OtpErlangFunction (tag, value) {
//       this.tag = tag;
//       this.value = value;
//   };
//   Erlang.OtpErlangFunction.prototype.binary = function() {
//       return Buffer.concat([new bufferFrom([this.tag]), this.value]);
//   };
//   Erlang.OtpErlangFunction.prototype.toString = function() {
//       return 'OtpErlangFunction(' + this.tag + ')';
//   };

//   Erlang.OtpErlangList = function OtpErlangList (value, improper) {
//       this.value = value;
//       this.improper = typeof improper !== 'undefined' ? improper : false;
//   };
//   Erlang.OtpErlangList.prototype.binary = function() {
//       if (typeof this.value === 'object' &&
//           toNativeString.call(this.value) == '[object Array]') {
//           var length = this.value.length;
//           if (length == 0) {
//               return new bufferFrom([TAG_NIL_EXT]);
//           }
//           if (length > 4294967295) {
//               throw new OutputException('uint32 overflow');
//           }
//           var header = new bufferAlloc(5);
//           header[0] = TAG_LIST_EXT;
//           if (this.improper) {
//               packUint32(length - 1, 1, header);
//           }
//           else {
//               packUint32(length, 1, header);
//           }
//           var buffers = [header];
//           for (var i = 0; i < length; i++) {
//               buffers.push(Erlang._term_to_binary(this.value[i]));
//           }
//           if (! this.improper) {
//               buffers.push(new bufferFrom([TAG_NIL_EXT]));
//           }
//           return Buffer.concat(buffers);
//       }
//       else {
//           throw new OutputException('unknown list type');
//       }
//   };

//   Erlang.OtpErlangList.prototype.toString = function() {
//       return 'OtpErlangList([' + this.value.join(',') + '],' +
//                             this.improper + ')';
//   };

//   Erlang.OtpErlangMap = function OtpErlangMap (value) {
//       this.value = value;
//   };
//   Erlang.OtpErlangMap.prototype.binary = function() {
//       if (typeof this.value === 'object' &&
//           toNativeString.call(this.value) == '[object Object]') {
//           return Erlang._object_to_binary(this.value);
//       }
//       else {
//           throw new OutputException('unknown map type');
//       }
//   };
//   Erlang.OtpErlangMap.prototype.toString = function() {
//       return 'OtpErlangMap()';
//   };

//   Erlang.OtpErlangPid = function OtpErlangPid (node, id, serial, creation) {
//       this.node = node;
//       this.id = id;
//       this.serial = serial;
//       this.creation = creation;
//   };
//   Erlang.OtpErlangPid.prototype.binary = function() {
//       var creation_size = this.creation.length;
//       if (creation_size == 1) {
//           return Buffer.concat([new bufferFrom([TAG_PID_EXT]),
//                                 this.node.binary(),
//                                 this.id, this.serial, this.creation]);
//       }
//       else if (creation_size == 4) {
//           return Buffer.concat([new bufferFrom([TAG_NEW_PID_EXT]),
//                                 this.node.binary(),
//                                 this.id, this.serial, this.creation]);
//       }
//       else {
//           throw new OutputException('unknown pid type');
//       }
//   };
//   Erlang.OtpErlangPid.prototype.toString = function() {
//       return 'OtpErlangPid()';
//   };

//   Erlang.OtpErlangPort = function OtpErlangPort (node, id, creation) {
//       this.node = node;
//       this.id = id;
//       this.creation = creation;
//   };
//   Erlang.OtpErlangPort.prototype.binary = function() {
//       var creation_size = this.creation.length;
//       if (creation_size == 1) {
//           return Buffer.concat([new bufferFrom([TAG_PORT_EXT]),
//                                 this.node.binary(), this.id, this.creation]);
//       }
//       else if (creation_size == 4) {
//           return Buffer.concat([new bufferFrom([TAG_NEW_PORT_EXT]),
//                                 this.node.binary(), this.id, this.creation]);
//       }
//       else {
//           throw new OutputException('unknown port type');
//       }
//   };
//   Erlang.OtpErlangPort.prototype.toString = function() {
//       return 'OtpErlangPort()';
//   };

//   Erlang.OtpErlangReference = function OtpErlangReference (node, id, creation) {
//       this.node = node;
//       this.id = id;
//       this.creation = creation;
//   };
//   Erlang.OtpErlangReference.prototype.binary = function() {
//       var length = this.id.length / 4;
//       if (length == 0) {
//           var header = new bufferAlloc(3);
//           header[0] = TAG_REFERENCE_EXT;
//           packUint16(length, 1, header);
//           return Buffer.concat([header,
//                                 this.node.binary(), this.id, this.creation]);
//       }
//       else if (length <= 65535) {
//           var creation_size = this.creation.length;
//           var header = new bufferAlloc(3);
//           if (creation_size == 1) {
//               header[0] = TAG_NEW_REFERENCE_EXT;
//           }
//           else if (creation_size == 4) {
//               header[0] = TAG_NEWER_REFERENCE_EXT;
//           }
//           else {
//               throw new OutputException('unknown reference type');
//           }
//           packUint16(length, 1, header);
//           return Buffer.concat([header,
//                                 this.node.binary(), this.creation, this.id]);
//       }
//       else {
//           throw new OutputException('uint16 overflow');
//       }
//   };
//   Erlang.OtpErlangReference.prototype.toString = function() {
//       var tag;
//       var length = this.id.length / 4;
//       if (length == 0) {
//           tag = TAG_REFERENCE_EXT;
//       }
//       else {
//           var creation_size = this.creation.length;
//           if (creation_size == 1) {
//               tag = TAG_NEW_REFERENCE_EXT;
//           }
//           else if (creation_size == 4) {
//               tag = TAG_NEWER_REFERENCE_EXT;
//           }
//           else {
//               throw new OutputException('unknown reference type');
//           }
//       }
//       return 'OtpErlangReference(' + tag + ')';
//   };

//   // core functionality

//   Erlang.binary_to_term = function binary_to_term (data, callback) {
//       if (typeof callback === 'undefined') {
//           throw new InputException('callback required');
//       }
//       try {
//           if (typeof data === 'string') {
//               data = new bufferFrom(data, 'binary');
//           }
//           if (! Buffer.isBuffer(data)) {
//               throw new ParseException('not bytes input');
//           }
//           var size = data.length;
//           if (size <= 1) {
//               throw new ParseException('null input');
//           }
//           if (data[0] != TAG_VERSION) {
//               throw new ParseException('invalid version');
//           }
//           if (TAG_COMPRESSED_ZLIB == data[1]) {
//               if (size <= 6) {
//                   throw new ParseException('null compressed input');
//               }
//               var i = 2;
//               var size_uncompressed = unpackUint32(i, data);
//               if (size_uncompressed == 0) {
//                   throw new ParseException('compressed data null');
//               }
//               i += 4;
//               var data_compressed = data.slice(i);
//               var j = data_compressed.length;
//               uncompress(data_compressed, function(err, data_uncompressed) {
//                   if (err) {
//                       callback(err, undefined);
//                   }
//                   else {
//                       if (size_uncompressed != data_uncompressed.length) {
//                           callback(new ParseException('compression corrupt'),
//                                    undefined);
//                           return;
//                       }
//                       var result = Erlang._binary_to_term(0, data_uncompressed);
//                       if (result[0] != size_uncompressed) {
//                           callback(new ParseException('unparsed data'),
//                                    undefined);
//                           return;
//                       }
//                       callback(undefined, result[1]);
//                   }
//               });
//           }
//           else {
//               var result = Erlang._binary_to_term(1, data);
//               if (result[0] != size) {
//                   throw new ParseException('unparsed data');
//               }
//               callback(undefined, result[1]);
//           }
//       }
//       catch (err) {
//           if (! (err instanceof ParseException)) {
//               var err_new = new ParseException('missing data');
//               if (err.stack) {
//                   err_new.stack = err.stack;
//               }
//               err = err_new;
//           }
//           callback(err, undefined);
//       }
//   };

//   Erlang.term_to_binary = function term_to_binary (term, callback, compressed) {
//       if (typeof callback === 'undefined') {
//           throw new InputException('callback required');
//       }
//       compressed = typeof compressed !== 'undefined' ? compressed : false;
//       try {
//           var data_uncompressed = Erlang._term_to_binary(term);
//           if (compressed === false) {
//               callback(undefined,
//                        Buffer.concat([new bufferFrom([TAG_VERSION]),
//                                       data_uncompressed]));
//           }
//           else {
//               if (compressed === true) {
//                   compressed = 6;
//               }
//               else if (compressed < 0 || compressed > 9) {
//                   throw new InputException('compressed in [0..9]');
//               }
//               else if (compressed === 0) {
//                   throw new InputException('node.js zlib compressed 0 broken');
//               }
//               compress(data_uncompressed, compressed,
//                        function (err, data_compressed) {
//                   if (err) {
//                       callback(err, undefined);
//                   }
//                   else {
//                       var size_uncompressed = data_uncompressed.length;
//                       if (size_uncompressed > 4294967295) {
//                           throw new OutputException('uint32 overflow');
//                       }
//                       var header = new bufferAlloc(6);
//                       header[0] = TAG_VERSION;
//                       header[1] = TAG_COMPRESSED_ZLIB;
//                       packUint32(size_uncompressed, 2, header);
//                       callback(undefined,
//                                Buffer.concat([header, data_compressed]));
//                   }
//               });
//           }
//       }
//       catch (err) {
//           if (! (err instanceof InputException ||
//                  err instanceof OutputException)) {
//               var err_new = new OutputException(err.toString());
//               if (err.stack) {
//                   err_new.stack = err.stack;
//               }
//               err = err_new;
//           }
//           callback(err, undefined);
//       }
//   };

//   // binary_to_term implementation functions

//   Erlang._binary_to_term = function _binary_to_term (i, data) {
//       var tag = data[i];
//       i += 1;
//       switch (tag) {
//           case TAG_NEW_FLOAT_EXT:
//               var buffer = new ArrayBuffer(8);
//               var view = new Uint8Array(buffer);
//               for (var offset = 0; offset < 8; ++offset) {
//                   view[offset] = data[i + offset];
//               }
//               var value = new DataView(buffer);
//               return [i + 8, value.getFloat64(0)];
//           case TAG_BIT_BINARY_EXT:
//               var j = unpackUint32(i, data);
//               i += 4;
//               var bits = data[i];
//               i += 1;
//               return [i + j,
//                       new Erlang.OtpErlangBinary(data.slice(i, i + j), bits)];
//           case TAG_ATOM_CACHE_REF:
//               return [i + 1, new Erlang.OtpErlangAtom(data[i])];
//           case TAG_SMALL_INTEGER_EXT:
//               return [i + 1, data[i]];
//           case TAG_INTEGER_EXT:
//               var value = unpackUint32(i, data);
//               if (0 != (value & 0x80000000)) {
//                   value = -2147483648 + (value & 0x7fffffff);
//               }
//               return [i + 4, value];
//           case TAG_FLOAT_EXT:
//               return [i + 31, parseFloat(data.toString('binary', i, i + 31))];
//           case TAG_ATOM_EXT:
//               var j = unpackUint16(i, data);
//               i += 2;
//               return [i + j, new Erlang.OtpErlangAtom(data.toString('binary',
//                                                                     i, i + j))];
//           case TAG_NEW_PORT_EXT:
//           case TAG_REFERENCE_EXT:
//           case TAG_PORT_EXT:
//               var result = Erlang._binary_to_atom(i, data);
//               i = result[0];
//               var node = result[1];
//               var id = data.slice(i, i + 4);
//               i += 4;
//               var creation;
//               if (tag == TAG_NEW_PORT_EXT) {
//                   creation = data.slice(i, i + 4);
//                   i += 4;
//               }
//               else {
//                   creation = data.slice(i, i + 1);
//                   i += 1;
//                   if (tag == TAG_REFERENCE_EXT) {
//                       return [i, new Erlang.OtpErlangReference(node, id,
//                                                                creation)];
//                   }
//               }
//               // tag == TAG_NEW_PORT_EXT || tag == TAG_PORT_EXT
//               return [i, new Erlang.OtpErlangPort(node, id, creation)];
//           case TAG_NEW_PID_EXT:
//           case TAG_PID_EXT:
//               var result = Erlang._binary_to_atom(i, data);
//               i = result[0];
//               var node = result[1];
//               var id = data.slice(i, i + 4);
//               i += 4;
//               var serial = data.slice(i, i + 4);
//               i += 4;
//               var creation;
//               if (tag == TAG_NEW_PID_EXT) {
//                   creation = data.slice(i, i + 4);
//                   i += 4;
//               }
//               else if (tag == TAG_PID_EXT) {
//                   creation = data.slice(i, i + 1);
//                   i += 1;
//               }
//               return [i, new Erlang.OtpErlangPid(node, id, serial, creation)];
//           case TAG_SMALL_TUPLE_EXT:
//           case TAG_LARGE_TUPLE_EXT:
//               var length;
//               if (tag == TAG_SMALL_TUPLE_EXT) {
//                   length = data[i];
//                   i += 1;
//               }
//               else if (tag == TAG_LARGE_TUPLE_EXT) {
//                   length = unpackUint32(i, data);
//                   i += 4;
//               }
//               return Erlang._binary_to_term_sequence(i, length, data);
//           case TAG_NIL_EXT:
//               return [i, new Erlang.OtpErlangList([])];
//           case TAG_STRING_EXT:
//               var j = unpackUint16(i, data);
//               i += 2;
//               return [i + j, data.toString('binary', i, i + j)];
//           case TAG_LIST_EXT:
//               var length = unpackUint32(i, data);
//               i += 4;
//               var result = Erlang._binary_to_term_sequence(i, length, data);
//               i = result[0];
//               var tmp = result[1];
//               result = Erlang._binary_to_term(i, data);
//               i = result[0];
//               var tail = result[1];
//               if (! (tail instanceof Erlang.OtpErlangList) ||
//                   tail.value.length != 0) {
//                   tmp.push(tail);
//                   tmp = new Erlang.OtpErlangList(tmp, true);
//               }
//               else {
//                   tmp = new Erlang.OtpErlangList(tmp);
//               }
//               return [i, tmp];
//           case TAG_BINARY_EXT:
//               var j = unpackUint32(i, data);
//               i += 4;
//               return [i + j,
//                       new Erlang.OtpErlangBinary(data.slice(i, i + j), 8)];
//           case TAG_SMALL_BIG_EXT:
//           case TAG_LARGE_BIG_EXT:
//               var j;
//               if (tag == TAG_SMALL_BIG_EXT) {
//                   j = data[i];
//                   i += 1;
//               }
//               else if (tag == TAG_LARGE_BIG_EXT) {
//                   j = unpackUint32(i, data);
//                   i += 4;
//               }
//               var sign = data[i];
//               var bignum = 0;
//               for (var bignum_index = 0; bignum_index < j; bignum_index++) {
//                   bignum = bignum * 256 + data[i + j - bignum_index];
//               }
//               if (sign == 1) {
//                   bignum *= -1;
//               }
//               i += 1;
//               return [i + j, bignum];
//           case TAG_NEW_FUN_EXT:
//               var length = unpackUint32(i, data);
//               return [i + length,
//                       new Erlang.OtpErlangFunction(tag,
//                                                    data.slice(i, i + length))];
//           case TAG_EXPORT_EXT:
//               var old_i = i;
//               var result = Erlang._binary_to_atom(i, data);
//               i = result[0];
//               var module = result[1];
//               result = Erlang._binary_to_atom(i, data);
//               i = result[0];
//               var f = result[1];
//               if (data[i] != TAG_SMALL_INTEGER_EXT) {
//                   throw new ParseException('invalid small integer tag');
//               }
//               i += 1;
//               var arity = data[i];
//               i += 1;
//               return [i,
//                       new Erlang.OtpErlangFunction(tag, data.slice(old_i, i))];
//           case TAG_NEWER_REFERENCE_EXT:
//           case TAG_NEW_REFERENCE_EXT:
//               var j = unpackUint16(i, data) * 4;
//               i += 2;
//               var result = Erlang._binary_to_atom(i, data);
//               i = result[0];
//               var node = result[1];
//               var creation;
//               if (tag == TAG_NEWER_REFERENCE_EXT) {
//                   creation = data.slice(i, i + 4);
//                   i += 4;
//               }
//               else if (tag == TAG_NEW_REFERENCE_EXT) {
//                   creation = data.slice(i, i + 1);
//                   i += 1;
//               }
//               return [i + j,
//                       new Erlang.OtpErlangReference(node, data.slice(i, i + j),
//                                                     creation)]
//           case TAG_SMALL_ATOM_EXT:
//               var j = data[i];
//               i += 1;
//               var atom_name = data.toString('binary', i, i + j);
//               var tmp;
//               if (atom_name == 'true') {
//                   tmp = true;
//               }
//               else if (atom_name == 'false') {
//                   tmp = false;
//               }
//               else {
//                   tmp = new Erlang.OtpErlangAtom(atom_name);
//               }
//               return [i + j, tmp];
//           case TAG_MAP_EXT:
//               var length = unpackUint32(i, data);
//               i += 4;
//               var pairs = {};
//               for (var length_index = 0; length_index < length; length_index++) {
//                   var result = Erlang._binary_to_term(i, data);
//                   i = result[0];
//                   var key = result[1];
//                   result = Erlang._binary_to_term(i, data);
//                   i = result[0];
//                   var value = result[1];
//                   pairs[key] = value;
//               }
//               return [i, new Erlang.OtpErlangMap(pairs)];
//           case TAG_FUN_EXT:
//               var old_i = i;
//               var numfree = unpackUint32(i, data);
//               i += 4;
//               var result = Erlang._binary_to_pid(i, data);
//               i = result[0];
//               var pid = result[1];
//               var result = Erlang._binary_to_atom(i, data);
//               i = result[0];
//               var module = result[1];
//               var result = Erlang._binary_to_integer(i, data);
//               i = result[0];
//               var index = result[1];
//               var result = Erlang._binary_to_integer(i, data);
//               i = result[0];
//               var uniq = result[1];
//               var result = Erlang._binary_to_term_sequence(i, numfree, data);
//               i = result[0];
//               var free = result[1];
//               return [i,
//                       new Erlang.OtpErlangFunction(tag, data.slice(old_i, i))];
//           case TAG_ATOM_UTF8_EXT:
//               var j = unpackUint16(i, data);
//               i += 2;
//               var atom_name = data.toString('binary', i, i + j);
//               return [i + j, new Erlang.OtpErlangAtom(atom_name, true)];
//           case TAG_SMALL_ATOM_UTF8_EXT:
//               var j = data[i];
//               i += 1;
//               var atom_name = data.toString('binary', i, i + j);
//               return [i + j, new Erlang.OtpErlangAtom(atom_name, true)];
//           case TAG_COMPRESSED_ZLIB:
//               // never happens with Erlang output
//               // (not handled here to avoid going to callback hell)
//               throw new ParseException('nested compression unsupported');
//           default:
//               throw new ParseException('invalid tag');
//       }
//   };

//   Erlang._binary_to_term_sequence = function _binary_to_term_sequence
//                                              (i, length, data) {
//       var sequence = [];
//       for (var length_index = 0; length_index < length; length_index++) {
//           var result = Erlang._binary_to_term(i, data);
//           i = result[0];
//           sequence.push(result[1]);
//       }
//       return [i, sequence];
//   };

//   // (binary_to_term Erlang term primitive type functions)

//   Erlang._binary_to_integer = function _binary_to_integer (i, data) {
//       var tag = data[i];
//       i += 1;
//       switch (tag) {
//           case TAG_SMALL_INTEGER_EXT:
//               return [i + 1, data[i]];
//           case TAG_INTEGER_EXT:
//               var value = unpackUint32(i, data);
//               if (0 != (value & 0x80000000)) {
//                   value = -2147483648 + (value & 0x7fffffff);
//               }
//               return [i + 4, value];
//           default:
//               throw new ParseException('invalid integer tag');
//       }
//   };

//   Erlang._binary_to_pid = function _binary_to_pid (i, data) {
//       var tag = data[i];
//       i += 1;
//       switch (tag) {
//           case TAG_NEW_PID_EXT:
//               var result = Erlang._binary_to_atom(i, data);
//               i = result[0];
//               var node = result[1];
//               var id = data.slice(i, i + 4);
//               i += 4;
//               var serial = data.slice(i, i + 4);
//               i += 4;
//               var creation = data.slice(i, i + 4);
//               i += 4;
//               return [i, new Erlang.OtpErlangPid(node, id, serial, creation)];
//           case TAG_PID_EXT:
//               var result = Erlang._binary_to_atom(i, data);
//               i = result[0];
//               var node = result[1];
//               var id = data.slice(i, i + 4);
//               i += 4;
//               var serial = data.slice(i, i + 4);
//               i += 4;
//               var creation = data.slice(i, i + 1);
//               i += 1;
//               return [i, new Erlang.OtpErlangPid(node, id, serial, creation)];
//           default:
//               throw new ParseException('invalid pid tag');
//       }
//   };

//   Erlang._binary_to_atom = function _binary_to_atom (i, data) {
//       var tag = data[i];
//       i += 1;
//       switch (tag) {
//           case TAG_ATOM_EXT:
//               var j = unpackUint16(i, data);
//               i += 2;
//               return [i + j,
//                       new Erlang.OtpErlangAtom(data.toString('binary',
//                                                              i, i + j))];
//           case TAG_ATOM_CACHE_REF:
//               return [i + 1, new Erlang.OtpErlangAtom(data[i])];
//           case TAG_SMALL_ATOM_EXT:
//               var j = data[i];
//               i += 1;
//               return [i + j,
//                       new Erlang.OtpErlangAtom(data.toString('binary',
//                                                              i, i + j))];
//           case TAG_ATOM_UTF8_EXT:
//               var j = unpackUint16(i, data);
//               i += 2;
//               return [i + j,
//                       new Erlang.OtpErlangAtom(data.toString('binary',
//                                                              i, i + j), true)];
//           case TAG_SMALL_ATOM_UTF8_EXT:
//               var j = data[i];
//               i += 1;
//               return [i + j,
//                       new Erlang.OtpErlangAtom(data.toString('binary',
//                                                              i, i + j), true)];
//           default:
//               throw new ParseException('invalid atom tag');
//       }
//   };

//   // term_to_binary implementation functions

//   Erlang._term_to_binary = function _term_to_binary (term) {
//       switch (typeof term) {
//           case 'string':
//               return Erlang._string_to_binary(term);
//           case 'number':
//               if (isFinite(term) && term % 1 === 0) {
//                   return Erlang._integer_to_binary(term);
//               }
//               else {
//                   return Erlang._float_to_binary(term);
//               }
//           case 'boolean':
//               if (term) {
//                   term = new Erlang.OtpErlangAtom('true');
//               }
//               else {
//                   term = new Erlang.OtpErlangAtom('false');
//               }
//               return term.binary();
//           case 'undefined':
//               term = new Erlang.OtpErlangAtom('undefined');
//               return term.binary();
//           case 'object':
//               switch (toNativeString.call(term)) {
//                   case '[object Array]':
//                       return Erlang._tuple_to_binary(term);
//                   case '[object Object]':
//                       if (term instanceof Erlang.OtpErlangAtom ||
//                           term instanceof Erlang.OtpErlangAtomLarge ||
//                           term instanceof Erlang.OtpErlangList ||
//                           term instanceof Erlang.OtpErlangBinary ||
//                           term instanceof Erlang.OtpErlangFunction ||
//                           term instanceof Erlang.OtpErlangReference ||
//                           term instanceof Erlang.OtpErlangPort ||
//                           term instanceof Erlang.OtpErlangPid) {
//                           return term.binary();
//                       }
//                       else {
//                           return Erlang._object_to_binary(term);
//                       }
//                   default:
//                       throw new OutputException('unknown javascript object type');
//               }
//           default:
//               throw new OutputException('unknown javascript type');
//       }
//   };

//   // (term_to_binary Erlang term composite type functions)

//   Erlang._string_to_binary = function _string_to_binary (term) {
//       var length = term.length;
//       if (length == 0) {
//           return new bufferFrom([TAG_NIL_EXT]);
//       }
//       else if (length <= 65535) {
//           var buffer = new bufferAlloc(3 + length);
//           buffer[0] = TAG_STRING_EXT;
//           packUint16(length, 1, buffer);
//           buffer.write(term, 3, length, 'binary');
//           return buffer;
//       }
//       else if (length <= 4294967295) {
//           var buffer = new bufferAlloc(6 + 2 * length);
//           buffer[0] = TAG_LIST_EXT;
//           packUint32(length, 1, buffer);
//           for (var i = 0; i < length; i++) {
//               var j = 5 + 2 * i;
//               buffer[j] = TAG_SMALL_INTEGER_EXT;
//               buffer[j + 1] = term.charCodeAt(i);
//           }
//           buffer[5 + 2 * length] = TAG_NIL_EXT;
//           return buffer;
//       }
//       else {
//           throw new OutputException('uint32 overflow');
//       }
//   };

//   Erlang._tuple_to_binary = function _tuple_to_binary (term) {
//       var length = term.length;
//       var header;
//       if (length <= 255) {
//           header = new bufferAlloc(2);
//           header[0] = TAG_SMALL_TUPLE_EXT;
//           header[1] = length;
//       }
//       else if (length <= 4294967295) {
//           header = new bufferAlloc(5);
//           header[0] = TAG_LARGE_TUPLE_EXT;
//           packUint32(length, 1, header);
//       }
//       else {
//           throw new OutputException('uint32 overflow');
//       }
//       var buffers = [header];
//       for (var i = 0; i < length; i++) {
//           buffers.push(Erlang._term_to_binary(term[i]));
//       }
//       return Buffer.concat(buffers);
//   };

//   Erlang._object_to_binary = function _object_to_binary (term) {
//       var length = 0;
//       var buffers = [];
//       for (var key in term) {
//           if (term.hasOwnProperty(key)) {
//               length++;
//               buffers.push(Erlang._term_to_binary(key));
//               buffers.push(Erlang._term_to_binary(term[key]));
//           }
//       }
//       if (length <= 4294967295) {
//           var header = new bufferAlloc(5);
//           header[0] = TAG_MAP_EXT;
//           packUint32(length, 1, header);
//           buffers.unshift(header)
//           return Buffer.concat(buffers);
//       }
//       else {
//           throw new OutputException('uint32 overflow');
//       }
//   };

//   // (term_to_binary Erlang term primitive type functions)

//   Erlang._integer_to_binary = function _integer_to_binary (term) {
//       if (0 <= term && term <= 255) {
//           return new bufferFrom([TAG_SMALL_INTEGER_EXT, term]);
//       }
//       else if (-2147483648 <= term && term <= 2147483647) {
//           var buffer = new bufferAlloc(5);
//           buffer[0] = TAG_INTEGER_EXT;
//           packUint32(term, 1, buffer);
//           return buffer;
//       }
//       else {
//           return Erlang._bignum_to_binary(term);
//       }
//   };

//   Erlang._bignum_to_binary = function _bignum_to_binary (term) {
//       var bignum = Math.abs(term);
//       if (term < 0) {
//           sign = 1;
//       }
//       else {
//           sign = 0;
//       }
//       var buffers = [];
//       while (bignum > 0) {
//           var b = new bufferAlloc(1)
//           b[0] = bignum & 255;
//           buffers.push(b);
//           bignum >>>= 8;
//       }
//       var length = buffers.length;
//       if (length <= 255) {
//           var header = new bufferAlloc(3);
//           header[0] = TAG_SMALL_BIG_EXT;
//           header[1] = length;
//           header[2] = sign;
//           buffers.unshift(header);
//           return Buffer.concat(buffers);
//       }
//       else if (length <= 4294967295) {
//           var header = new bufferAlloc(6);
//           header[0] = TAG_LARGE_BIG_EXT;
//           packUint32(length, 1, header);
//           header[5] = sign;
//           buffers.unshift(header);
//           return Buffer.concat(buffers);
//       }
//       else {
//           throw new OutputException('uint32 overflow');
//       }
//   };

//   Erlang._float_to_binary = function _float_to_binary (term) {
//       var buffer_in = new ArrayBuffer(8);
//       var value = new DataView(buffer_in);
//       value.setFloat64(0, term);
//       var view = new Uint8Array(buffer_in);
//       var buffer_out = new bufferAlloc(9);
//       buffer_out[0] = TAG_NEW_FLOAT_EXT;
//       for (var i = 0; i < 8; i++) {
//           buffer_out[1 + i] = view[i];
//       }
//       return buffer_out;
//   };

//   // Exception objects listed alphabetically

//   Erlang.InputException = InputException;
//   Erlang.OutputException = OutputException;
//   Erlang.ParseException = ParseException;

//   };