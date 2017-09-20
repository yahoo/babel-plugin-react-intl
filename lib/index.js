'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _symbol = require('babel-runtime/core-js/symbol');

var _symbol2 = _interopRequireDefault(_symbol);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

exports.default = function (_ref) {
    var _generators;

    var t = _ref.types;

    function getModuleSourceName(opts) {
        return opts.moduleSourceName || 'react-intl';
    }

    function evaluatePath(path) {
        var evaluated = path.evaluate();
        if (evaluated.confident) {
            return evaluated.value;
        }

        throw path.buildCodeFrameError('[React Intl] Messages must be statically evaluate-able for extraction.');
    }

    function getMessageDescriptorKey(path) {
        if (path.isIdentifier() || path.isJSXIdentifier()) {
            return path.node.name;
        }

        return evaluatePath(path);
    }

    function getMessageDescriptorValue(path) {
        if (path.isJSXExpressionContainer()) {
            path = path.get('expression');
        }

        // Always trim the Message Descriptor values.
        var descriptorValue = evaluatePath(path);

        if (typeof descriptorValue === 'string') {
            return descriptorValue.trim();
        }

        return descriptorValue;
    }

    function getICUMessageValue(messagePath) {
        var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref2$isJSXSource = _ref2.isJSXSource,
            isJSXSource = _ref2$isJSXSource === undefined ? false : _ref2$isJSXSource;

        var message = getMessageDescriptorValue(messagePath);

        try {
            return (0, _printIcuMessage2.default)(message);
        } catch (parseError) {
            if (isJSXSource && messagePath.isLiteral() && message.indexOf('\\\\') >= 0) {

                throw messagePath.buildCodeFrameError('[React Intl] Message failed to parse. ' + 'It looks like `\\`s were used for escaping, ' + 'this won\'t work with JSX string literals. ' + 'Wrap with `{}`. ' + 'See: http://facebook.github.io/react/docs/jsx-gotchas.html');
            }

            throw messagePath.buildCodeFrameError('[React Intl] Message failed to parse. ' + 'See: http://formatjs.io/guides/message-syntax/' + ('\n' + parseError));
        }
    }

    function createMessageDescriptor(propPaths) {
        return propPaths.reduce(function (hash, _ref3) {
            var _ref4 = (0, _slicedToArray3.default)(_ref3, 2),
                keyPath = _ref4[0],
                valuePath = _ref4[1];

            var key = getMessageDescriptorKey(keyPath);

            if (DESCRIPTOR_PROPS.has(key)) {
                hash[key] = valuePath;
            }

            return hash;
        }, {});
    }

    function evaluateMessageDescriptor(_ref5) {
        var _ref6 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref6$isJSXSource = _ref6.isJSXSource,
            isJSXSource = _ref6$isJSXSource === undefined ? false : _ref6$isJSXSource;

        var descriptor = (0, _objectWithoutProperties3.default)(_ref5, []);

        (0, _keys2.default)(descriptor).forEach(function (key) {
            var valuePath = descriptor[key];

            if (key === 'defaultMessage') {
                descriptor[key] = getICUMessageValue(valuePath, { isJSXSource: isJSXSource });
            } else {
                descriptor[key] = getMessageDescriptorValue(valuePath);
            }
        });

        return descriptor;
    }

    function storeMessage(_ref7, path, state) {
        var id = _ref7.id,
            description = _ref7.description,
            defaultMessage = _ref7.defaultMessage;
        var file = state.file,
            opts = state.opts;


        if (!id) {
            throw path.buildCodeFrameError('[React Intl] Message descriptors require an `id`.');
        }

        if (opts.enforceDefaultMessage === undefined || opts.enforceDefaultMessage === true) {
            if (!defaultMessage) {
                throw path.buildCodeFrameError('[React Intl] Message descriptors require an `defaultMessage`.');
            }
        }

        var messages = file.get(MESSAGES);
        if (messages.has(id)) {
            var existing = messages.get(id);

            if (description !== existing.description || (defaultMessage || id) !== existing.defaultMessage) {
                throw path.buildCodeFrameError('[React Intl] Duplicate message id: "' + id + '", ' + 'but the `description` and/or `defaultMessage` are different.');
            }
        }

        if (opts.enforceDescriptions) {
            if (!description || (typeof description === 'undefined' ? 'undefined' : (0, _typeof3.default)(description)) === 'object' && (0, _keys2.default)(description).length < 1) {
                throw path.buildCodeFrameError('[React Intl] Message must have a `description`.');
            }
        }

        var loc = void 0;
        if (opts.extractSourceLocation) {
            loc = (0, _extends3.default)({
                file: p.relative(process.cwd(), file.opts.filename)
            }, path.node.loc);
        }

        messages.set(id, (0, _extends3.default)({ id: id, description: description, defaultMessage: defaultMessage || id }, loc));
    }

    function referencesImport(path, mod, importedNames) {
        if (!(path.isIdentifier() || path.isJSXIdentifier())) {
            return false;
        }

        return importedNames.some(function (name) {
            return path.referencesImport(mod, name);
        });
    }

    function tagAsExtracted(path) {
        path.node[EXTRACTED] = true;
    }

    function wasExtracted(path) {
        return !!path.node[EXTRACTED];
    }

    var existsCache = {};
    var contentsCache = {};

    function generateJSONMultiFile(file, opts, descriptors) {
        if (!opts.messagesDir) {
            return;
        }

        var _file$opts = file.opts,
            filename = _file$opts.filename,
            basename = _file$opts.basename;

        // Make sure the relative path is "absolute" before
        // joining it with the `messagesDir`.

        var relativePath = p.join(p.sep, p.relative(process.cwd(), filename));

        var messagesFilename = p.join(opts.messagesDir, p.dirname(relativePath), basename + '.json');

        var messagesFile = (0, _stringify2.default)(descriptors, null, 2);

        (0, _mkdirp.sync)(p.dirname(messagesFilename));
        (0, _fs.writeFileSync)(messagesFilename, messagesFile);
    }

    function generateJSONSingleFile(file, opts, descriptors) {
        if (!opts.messagesFile) {
            return;
        }

        var messages = {};

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = (0, _getIterator3.default)(descriptors), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var descriptor = _step.value;

                messages[descriptor.id] = descriptor.defaultMessage;
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        var localeFileName = opts.messagesFile;

        var localeMessages = {};
        var existingContentsHash = null;

        if (existsCache[localeFileName] === undefined) {
            existsCache[localeFileName] = (0, _fs.existsSync)(localeFileName);
        }

        if (existsCache[localeFileName]) {
            if (contentsCache[localeFileName] === undefined) {
                contentsCache[localeFileName] = {
                    contents: (0, _fs.readFileSync)(localeFileName)
                };
                contentsCache[localeFileName].md5 = (0, _crypto.createHash)('md5').update(contentsCache[localeFileName].contents).digest('hex');
            }

            localeMessages = JSON.parse(contentsCache[localeFileName].contents);
            existingContentsHash = contentsCache[localeFileName].md5;
        }

        localeMessages = (0, _assign2.default)({}, messages, localeMessages);
        localeMessages = (0, _keys2.default)(localeMessages).sort().reduce(function (o, k) {
            o[k] = localeMessages[k];
            return o;
        }, {});

        var newContents = (0, _stringify2.default)(localeMessages, null, 2) + '\n';
        var newContentsHash = (0, _crypto.createHash)('md5').update(newContents).digest('hex');

        if (newContentsHash !== existingContentsHash) {
            if (!existsCache[localeFileName]) {
                (0, _mkdirp.sync)(opts.messagesDir);
            }
            (0, _fs.writeFileSync)(localeFileName, newContents);
            existsCache[localeFileName] = true;
            contentsCache[localeFileName] = {
                contents: newContents,
                md5: newContentsHash
            };
        }
    }

    function copyAddChildElement(doc, el, parent) {
        var newEl = new _libxmljs.Element(doc, el.name());
        parent.addChild(newEl);
        newEl.namespace(el.namespace());

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = (0, _getIterator3.default)(el.attrs()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var attr = _step2.value;

                newEl.attr((0, _defineProperty3.default)({}, attr.name(), attr.value()));
                // FIXME: libxmljs does not handle attribute namespaces
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }

        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = (0, _getIterator3.default)(el.childNodes()), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var child = _step3.value;

                if (child.type() === 'element') {
                    copyAddChildElement(doc, child, newEl);
                } else {
                    newEl.addChild(child);
                }
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
                }
            }
        }

        return newEl;
    }

    function generateXLIFF12(file, opts, descriptors) {
        if (!opts.messagesFile) {
            return;
        }

        var relativeFileName = p.relative(process.cwd(), file.opts.filename);

        var localeFileName = opts.messagesFile;

        if (existsCache[localeFileName] === undefined) {
            existsCache[localeFileName] = (0, _fs.existsSync)(localeFileName);
        }

        var existingDoc = void 0;
        var existingContentsHash = null;

        if (existsCache[localeFileName]) {
            if (contentsCache[localeFileName] === undefined) {
                contentsCache[localeFileName] = {
                    contents: (0, _fs.readFileSync)(localeFileName)
                };
                contentsCache[localeFileName].md5 = (0, _crypto.createHash)('md5').update(contentsCache[localeFileName].contents).digest('hex');
            }

            existingContentsHash = contentsCache[localeFileName].md5;
            existingDoc = (0, _libxmljs.parseXml)(contentsCache[localeFileName].contents);

            var versionAttribute = existingDoc.root().attr('version');

            if (!versionAttribute || versionAttribute.value() !== '1.2') {
                throw '[React Intl] File ' + localeFileName + ' is not XLIFF 1.2 file.';
            }
        } else {
            existingDoc = new _libxmljs.Document('1.0', 'utf-8');
            var _rootNode = new _libxmljs.Element(existingDoc, 'xliff');
            _rootNode.defineNamespace(XLIFF12_NAMESPACE);
            _rootNode.namespace(XLIFF12_NAMESPACE);
            _rootNode.attr({
                'version': '1.2'
            });
            existingDoc.root(_rootNode);
        }

        var newDoc = new _libxmljs.Document('1.0', 'utf-8');
        var rootNode = new _libxmljs.Element(newDoc, 'xliff');
        rootNode.defineNamespace(XLIFF12_NAMESPACE);
        rootNode.namespace(XLIFF12_NAMESPACE);
        rootNode.attr({
            'version': '1.2'
        });
        newDoc.root(rootNode);

        var appendFileNodes = [];
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = (0, _getIterator3.default)(existingDoc.find('//xliff:file', { xliff: XLIFF12_NAMESPACE })), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var existingFileNode = _step4.value;

                var original = existingFileNode.attr('original').value();

                if (original < relativeFileName) {
                    copyAddChildElement(newDoc, existingFileNode, rootNode);
                } else if (original > relativeFileName) {
                    appendFileNodes.push(existingFileNode);
                }
            }
        } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                    _iterator4.return();
                }
            } finally {
                if (_didIteratorError4) {
                    throw _iteratorError4;
                }
            }
        }

        var fileNode = new _libxmljs.Element(newDoc, 'file');
        rootNode.addChild(fileNode);
        fileNode.namespace(XLIFF12_NAMESPACE);
        fileNode.attr({
            'original': relativeFileName,
            'datatype': 'plaintext',
            'source-language': opts.xliffSourceLanguage,
            'target-language': opts.xliffTargetLanguage
        });

        var bodyNode = new _libxmljs.Element(newDoc, 'body');
        fileNode.addChild(bodyNode);
        bodyNode.namespace(XLIFF12_NAMESPACE);

        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
            for (var _iterator5 = (0, _getIterator3.default)(descriptors), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                var descriptor = _step5.value;

                var transUnitNode = new _libxmljs.Element(newDoc, 'trans-unit');
                bodyNode.addChild(transUnitNode);
                transUnitNode.namespace(XLIFF12_NAMESPACE);
                transUnitNode.attr({
                    id: descriptor.id
                });

                var sourceNode = new _libxmljs.Element(newDoc, 'source');
                transUnitNode.addChild(sourceNode);
                sourceNode.namespace(XLIFF12_NAMESPACE);
                sourceNode.text(descriptor.id);

                var targetNode = new _libxmljs.Element(newDoc, 'target');
                transUnitNode.addChild(targetNode);
                targetNode.namespace(XLIFF12_NAMESPACE);

                var existingTargetNode = existingDoc.get('//xliff:file[@original = \'' + relativeFileName + '\']\n                    /xliff:body\n                    /xliff:trans-unit[xliff:source[text() = \'' + descriptor.id + '\']]\n                    /xliff:target', {
                    xliff: XLIFF12_NAMESPACE
                });

                if (existingTargetNode) {
                    targetNode.text(existingTargetNode.text().trim());
                } else {
                    targetNode.text(descriptor.defaultMessage);
                }

                if (descriptor.description) {
                    var noteNode = new _libxmljs.Element(newDoc, 'note');
                    transUnitNode.addChild(noteNode);
                    noteNode.namespace(XLIFF12_NAMESPACE);
                    noteNode.text(descriptor.description);
                }
            }
        } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion5 && _iterator5.return) {
                    _iterator5.return();
                }
            } finally {
                if (_didIteratorError5) {
                    throw _iteratorError5;
                }
            }
        }

        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
            for (var _iterator6 = (0, _getIterator3.default)(appendFileNodes), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                var _existingFileNode = _step6.value;

                copyAddChildElement(newDoc, _existingFileNode, rootNode);
            }
        } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion6 && _iterator6.return) {
                    _iterator6.return();
                }
            } finally {
                if (_didIteratorError6) {
                    throw _iteratorError6;
                }
            }
        }

        var newContents = newDoc.toString(true).trim() + '\n';
        var newContentsHash = (0, _crypto.createHash)('md5').update(newContents).digest('hex');

        if (newContentsHash !== existingContentsHash) {
            if (!existsCache[localeFileName]) {
                (0, _mkdirp.sync)(opts.messagesDir);
            }
            (0, _fs.writeFileSync)(localeFileName, newContents);
            existsCache[localeFileName] = true;
            contentsCache[localeFileName] = {
                contents: newContents,
                md5: newContentsHash
            };
        }
    }

    var generators = (_generators = {}, (0, _defineProperty3.default)(_generators, FORMAT_JSON_MULTI_FILE, generateJSONMultiFile), (0, _defineProperty3.default)(_generators, FORMAT_JSON_SINGLE_FILE, generateJSONSingleFile), (0, _defineProperty3.default)(_generators, FORMAT_XLIFF12, generateXLIFF12), _generators);

    return {
        pre: function pre(file) {
            if (!file.has(MESSAGES)) {
                file.set(MESSAGES, new _map2.default());
            }
        },
        post: function post(file) {
            var opts = this.opts;


            var messages = file.get(MESSAGES);
            var descriptors = [].concat((0, _toConsumableArray3.default)(messages.values()));

            descriptors.sort(function (a, b) {
                if (a.id < b.id) {
                    return -1;
                } else if (a.id > b.id) {
                    return 1;
                }

                return 0;
            });

            file.metadata['react-intl'] = { messages: descriptors };

            if (descriptors.length > 0) {
                var generate = generators[opts.format || FORMAT_JSON_MULTI_FILE];

                if (!generate) {
                    throw '[React Intl] Unknown format ' + opts.format + '.';
                }

                generate(file, opts, descriptors);
            }
        },


        visitor: {
            JSXOpeningElement: function JSXOpeningElement(path, state) {
                if (wasExtracted(path)) {
                    return;
                }

                var file = state.file,
                    opts = state.opts;

                var moduleSourceName = getModuleSourceName(opts);
                var name = path.get('name');

                if (name.referencesImport(moduleSourceName, 'FormattedPlural')) {
                    file.log.warn('[React Intl] Line ' + path.node.loc.start.line + ': ' + 'Default messages are not extracted from ' + '<FormattedPlural>, use <FormattedMessage> instead.');

                    return;
                }

                if (referencesImport(name, moduleSourceName, COMPONENT_NAMES)) {
                    var attributes = path.get('attributes').filter(function (attr) {
                        return attr.isJSXAttribute();
                    });

                    var descriptor = createMessageDescriptor(attributes.map(function (attr) {
                        return [attr.get('name'), attr.get('value')];
                    }));

                    // In order for a default message to be extracted when
                    // declaring a JSX element, it must be done with standard
                    // `key=value` attributes. But it's completely valid to
                    // write `<FormattedMessage {...descriptor} />`, because
                    // it will be skipped here and extracted elsewhere.
                    // The descriptor will be extracted only if a `id` prop exists.
                    if (descriptor.id) {
                        // Evaluate the Message Descriptor values in a JSX
                        // context, then store it.
                        descriptor = evaluateMessageDescriptor(descriptor, {
                            isJSXSource: true
                        });

                        storeMessage(descriptor, path, state);

                        // Remove description since it's not used at runtime.
                        attributes.some(function (attr) {
                            var ketPath = attr.get('name');
                            if (getMessageDescriptorKey(ketPath) === 'description') {
                                attr.remove();
                                return true;
                            }
                        });

                        // Tag the AST node so we don't try to extract it twice.
                        tagAsExtracted(path);
                    }
                }
            },
            CallExpression: function CallExpression(path, state) {
                var moduleSourceName = getModuleSourceName(state.opts);
                var callee = path.get('callee');

                function assertObjectExpression(node) {
                    if (!(node && node.isObjectExpression())) {
                        throw path.buildCodeFrameError('[React Intl] `' + callee.node.name + '()` must be ' + 'called with an object expression with values ' + 'that are React Intl Message Descriptors, also ' + 'defined as object expressions.');
                    }
                }

                function processMessageObject(messageObj) {
                    assertObjectExpression(messageObj);

                    if (wasExtracted(messageObj)) {
                        return;
                    }

                    var properties = messageObj.get('properties');

                    var descriptor = createMessageDescriptor(properties.map(function (prop) {
                        return [prop.get('key'), prop.get('value')];
                    }));

                    // Evaluate the Message Descriptor values, then store it.
                    descriptor = evaluateMessageDescriptor(descriptor);
                    storeMessage(descriptor, messageObj, state);

                    // Remove description since it's not used at runtime.
                    messageObj.replaceWith(t.objectExpression([t.objectProperty(t.stringLiteral('id'), t.stringLiteral(descriptor.id)), t.objectProperty(t.stringLiteral('defaultMessage'), t.stringLiteral(descriptor.defaultMessage || descriptor.id))]));

                    // Tag the AST node so we don't try to extract it twice.
                    tagAsExtracted(messageObj);
                }

                if (referencesImport(callee, moduleSourceName, FUNCTION_NAMES)) {
                    var messagesObj = path.get('arguments')[0];

                    assertObjectExpression(messagesObj);

                    messagesObj.get('properties').map(function (prop) {
                        return prop.get('value');
                    }).forEach(processMessageObject);
                }
            }
        }
    };
};

var _crypto = require('crypto');

var _fs = require('fs');

var _libxmljs = require('libxmljs');

var _mkdirp = require('mkdirp');

var _path = require('path');

var p = _interopRequireWildcard(_path);

var _printIcuMessage = require('./print-icu-message');

var _printIcuMessage2 = _interopRequireDefault(_printIcuMessage);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var COMPONENT_NAMES = ['FormattedMessage', 'FormattedHTMLMessage'];

var FUNCTION_NAMES = ['defineMessages'];

var DESCRIPTOR_PROPS = new _set2.default(['id', 'description', 'defaultMessage']);

var EXTRACTED = (0, _symbol2.default)('ReactIntlExtracted');
var MESSAGES = (0, _symbol2.default)('ReactIntlMessages');

var XLIFF12_NAMESPACE = 'urn:oasis:names:tc:xliff:document:1.2';

var FORMAT_JSON_MULTI_FILE = 'json-multi-file';
var FORMAT_JSON_SINGLE_FILE = 'json-single-file';
var FORMAT_XLIFF12 = 'xliff-1.2';