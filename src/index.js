/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import {createHash} from 'crypto';
import {existsSync, readFileSync, writeFileSync} from 'fs';
import {Document, Element, parseXml} from 'libxmljs';
import {sync as mkdirpSync} from 'mkdirp';
import * as p from 'path';
import printICUMessage from './print-icu-message';

const COMPONENT_NAMES = [
    'FormattedMessage',
    'FormattedHTMLMessage',
];

const FUNCTION_NAMES = [
    'defineMessages',
];

const DESCRIPTOR_PROPS = new Set(['id', 'description', 'defaultMessage']);

const EXTRACTED = Symbol('ReactIntlExtracted');
const MESSAGES = Symbol('ReactIntlMessages');

const XLIFF12_NAMESPACE = 'urn:oasis:names:tc:xliff:document:1.2';

const FORMAT_JSON_MULTI_FILE = 'json-multi-file';
const FORMAT_JSON_SINGLE_FILE = 'json-single-file';
const FORMAT_XLIFF12 = 'xliff-1.2';

export default function ({types: t}) {
    function getModuleSourceName(opts) {
        return opts.moduleSourceName || 'react-intl';
    }

    function evaluatePath(path) {
        const evaluated = path.evaluate();
        if (evaluated.confident) {
            return evaluated.value;
        }

        throw path.buildCodeFrameError(
            '[React Intl] Messages must be statically evaluate-able for extraction.'
        );
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
        const descriptorValue = evaluatePath(path);

        if (typeof descriptorValue === 'string') {
            return descriptorValue.trim();
        }

        return descriptorValue;
    }

    function getICUMessageValue(messagePath, {isJSXSource = false} = {}) {
        const message = getMessageDescriptorValue(messagePath);

        try {
            return printICUMessage(message);
        } catch (parseError) {
            if (isJSXSource &&
                messagePath.isLiteral() &&
                message.indexOf('\\\\') >= 0) {

                throw messagePath.buildCodeFrameError(
                    '[React Intl] Message failed to parse. ' +
                    'It looks like `\\`s were used for escaping, ' +
                    'this won\'t work with JSX string literals. ' +
                    'Wrap with `{}`. ' +
                    'See: http://facebook.github.io/react/docs/jsx-gotchas.html'
                );
            }

            throw messagePath.buildCodeFrameError(
                '[React Intl] Message failed to parse. ' +
                'See: http://formatjs.io/guides/message-syntax/' +
                `\n${parseError}`
            );
        }
    }

    function createMessageDescriptor(propPaths) {
        return propPaths.reduce((hash, [keyPath, valuePath]) => {
            const key = getMessageDescriptorKey(keyPath);

            if (DESCRIPTOR_PROPS.has(key)) {
                hash[key] = valuePath;
            }

            return hash;
        }, {});
    }

    function evaluateMessageDescriptor({...descriptor}, {isJSXSource = false} = {}) {
        Object.keys(descriptor).forEach((key) => {
            const valuePath = descriptor[key];

            if (key === 'defaultMessage') {
                descriptor[key] = getICUMessageValue(valuePath, {isJSXSource});
            } else {
                descriptor[key] = getMessageDescriptorValue(valuePath);
            }
        });

        return descriptor;
    }

    function storeMessage({id, description, defaultMessage}, path, state) {
        const {file, opts} = state;

        if (!id) {
            throw path.buildCodeFrameError(
                '[React Intl] Message descriptors require an `id`.'
            );
        }

        if (opts.enforceDefaultMessage === undefined || opts.enforceDefaultMessage === true) {
            if (!defaultMessage) {
                throw path.buildCodeFrameError(
                    '[React Intl] Message descriptors require an `defaultMessage`.'
                );
            }
        }

        const messages = file.get(MESSAGES);
        if (messages.has(id)) {
            const existing = messages.get(id);

            if (description !== existing.description ||
                (defaultMessage || id) !== existing.defaultMessage) {
                throw path.buildCodeFrameError(
                    `[React Intl] Duplicate message id: "${id}", ` +
                    'but the `description` and/or `defaultMessage` are different.'
                );
            }
        }

        if (opts.enforceDescriptions) {
            if (
                !description ||
                (typeof description === 'object' && Object.keys(description).length < 1)
            ) {
                throw path.buildCodeFrameError(
                    '[React Intl] Message must have a `description`.'
                );
            }
        }

        let loc;
        if (opts.extractSourceLocation) {
            loc = {
                file: p.relative(process.cwd(), file.opts.filename),
                ...path.node.loc,
            };
        }

        messages.set(id, {id, description, defaultMessage: defaultMessage || id, ...loc});
    }

    function referencesImport(path, mod, importedNames) {
        if (!(path.isIdentifier() || path.isJSXIdentifier())) {
            return false;
        }

        return importedNames.some((name) => path.referencesImport(mod, name));
    }

    function tagAsExtracted(path) {
        path.node[EXTRACTED] = true;
    }

    function wasExtracted(path) {
        return !!path.node[EXTRACTED];
    }

    let existsCache = {};
    let contentsCache = {};

    function generateJSONMultiFile(file, opts, descriptors) {
        if (!opts.messagesDir) {
            return;
        }

        const {filename, basename} = file.opts;

        // Make sure the relative path is "absolute" before
        // joining it with the `messagesDir`.
        const relativePath = p.join(p.sep, p.relative(process.cwd(), filename));

        const messagesFilename = p.join(
            opts.messagesDir,
            p.dirname(relativePath),
            basename + '.json'
        );

        const messagesFile = JSON.stringify(descriptors, null, 2);

        mkdirpSync(p.dirname(messagesFilename));
        writeFileSync(messagesFilename, messagesFile);
    }

    function generateJSONSingleFile(file, opts, descriptors) {
        if (!opts.messagesFile) {
            return;
        }

        let messages = {};

        for (let descriptor of descriptors) {
            messages[descriptor.id] = descriptor.defaultMessage;
        }

        const localeFileName = opts.messagesFile;

        let localeMessages = {};
        let existingContentsHash = null;

        if (existsCache[localeFileName] === undefined) {
            existsCache[localeFileName] = existsSync(localeFileName);
        }

        if (existsCache[localeFileName]) {
            if (contentsCache[localeFileName] === undefined) {
                contentsCache[localeFileName] = {
                    contents: readFileSync(localeFileName),
                };
                contentsCache[localeFileName].md5 = createHash('md5')
                    .update(contentsCache[localeFileName].contents)
                    .digest('hex');
            }

            localeMessages = JSON.parse(contentsCache[localeFileName].contents);
            existingContentsHash = contentsCache[localeFileName].md5;
        }

        localeMessages = Object.assign({}, messages, localeMessages);
        localeMessages = Object.keys(localeMessages).sort().reduce((o, k) => {
            o[k] = localeMessages[k];
            return o;
        }, {});

        const newContents = JSON.stringify(localeMessages, null, 2) + '\n';
        const newContentsHash = createHash('md5').update(newContents).digest('hex');

        if (newContentsHash !== existingContentsHash) {
            if (!existsCache[localeFileName]) {
                mkdirpSync(opts.messagesDir);
            }
            writeFileSync(localeFileName, newContents);
            existsCache[localeFileName] = true;
            contentsCache[localeFileName] = {
                contents: newContents,
                md5: newContentsHash,
            };
        }
    }

    function copyAddChildElement(doc, el, parent) {
        const newEl = new Element(doc, el.name());
        parent.addChild(newEl);
        newEl.namespace(el.namespace());

        for (let attr of el.attrs()) {
            newEl.attr({[attr.name()]: attr.value()});
            // FIXME: libxmljs does not handle attribute namespaces
        }

        for (let child of el.childNodes()) {
            if (child.type() === "element") {
                copyAddChildElement(doc, child, newEl);
            } else {
                newEl.addChild(child);
            }
        }

        return newEl;
    }

    function generateXLIFF12(file, opts, descriptors) {
        if (!opts.messagesFile) {
            return;
        }

        const relativeFileName = p.relative(process.cwd(), file.opts.filename);

        const localeFileName = opts.messagesFile;

        if (existsCache[localeFileName] === undefined) {
            existsCache[localeFileName] = existsSync(localeFileName);
        }

        let existingDoc;
        let existingContentsHash = null;

        if (existsCache[localeFileName]) {
            if (contentsCache[localeFileName] === undefined) {
                contentsCache[localeFileName] = {
                    contents: readFileSync(localeFileName),
                };
                contentsCache[localeFileName].md5 = createHash('md5')
                    .update(contentsCache[localeFileName].contents)
                    .digest('hex');
            }

            existingContentsHash = contentsCache[localeFileName].md5;
            existingDoc = parseXml(contentsCache[localeFileName].contents);

            const versionAttribute = existingDoc.root().attr('version');

            if (!versionAttribute || versionAttribute.value() !== '1.2') {
                throw `[React Intl] File ${localeFileName} is not XLIFF 1.2 file.`;
            }

        } else {
            existingDoc = new Document('1.0', 'utf-8');
            const rootNode = new Element(existingDoc, 'xliff');
            rootNode.defineNamespace(XLIFF12_NAMESPACE);
            rootNode.namespace(XLIFF12_NAMESPACE);
            rootNode.attr({
                'version': '1.2',
            });
            existingDoc.root(rootNode);
        }

        const newDoc = new Document('1.0', 'utf-8');
        const rootNode = new Element(newDoc, 'xliff');
        rootNode.defineNamespace(XLIFF12_NAMESPACE);
        rootNode.namespace(XLIFF12_NAMESPACE);
        rootNode.attr({
            'version': '1.2',
        });
        newDoc.root(rootNode);

        let appendFileNodes = [];
        for (let existingFileNode of existingDoc.find(`//xliff:file`, {xliff: XLIFF12_NAMESPACE})) {
            const original = existingFileNode.attr('original').value();

            if (original < relativeFileName) {
                copyAddChildElement(newDoc, existingFileNode, rootNode);

            } else if (original > relativeFileName) {
                appendFileNodes.push(existingFileNode);
            }
        }

        const fileNode = new Element(newDoc, 'file');
        rootNode.addChild(fileNode);
        fileNode.namespace(XLIFF12_NAMESPACE);
        fileNode.attr({
            'original': relativeFileName,
            'datatype': 'plaintext',
            'source-language': opts.xliffSourceLanguage,
            'target-language': opts.xliffTargetLanguage,
        });

        const bodyNode = new Element(newDoc, 'body');
        fileNode.addChild(bodyNode);
        bodyNode.namespace(XLIFF12_NAMESPACE);

        for (let descriptor of descriptors) {
            const transUnitNode = new Element(newDoc, 'trans-unit');
            bodyNode.addChild(transUnitNode);
            transUnitNode.namespace(XLIFF12_NAMESPACE);
            transUnitNode.attr({
                id: descriptor.id,
            });

            const sourceNode = new Element(newDoc, 'source');
            transUnitNode.addChild(sourceNode);
            sourceNode.namespace(XLIFF12_NAMESPACE);
            sourceNode.text(descriptor.id);

            const targetNode = new Element(newDoc, 'target');
            transUnitNode.addChild(targetNode);
            targetNode.namespace(XLIFF12_NAMESPACE);

            const existingTargetNode = existingDoc.get(
                `//xliff:file[@original = '${relativeFileName}']
                    /xliff:body
                    /xliff:trans-unit[xliff:source[text() = '${descriptor.id}']]
                    /xliff:target`,
                {
                    xliff: XLIFF12_NAMESPACE,
                }
            );

            if (existingTargetNode) {
                targetNode.text(existingTargetNode.text().trim());
            } else {
                targetNode.text(descriptor.defaultMessage);
            }

            if (descriptor.description) {
                const noteNode = new Element(newDoc, 'note');
                transUnitNode.addChild(noteNode);
                noteNode.namespace(XLIFF12_NAMESPACE);
                noteNode.text(descriptor.description);
            }
        }

        for (let existingFileNode of appendFileNodes) {
            copyAddChildElement(newDoc, existingFileNode, rootNode);
        }

        const newContents = newDoc.toString(true).trim() + '\n';
        const newContentsHash = createHash('md5').update(newContents).digest('hex');

        if (newContentsHash !== existingContentsHash) {
            if (!existsCache[localeFileName]) {
                mkdirpSync(opts.messagesDir);
            }
            writeFileSync(localeFileName, newContents);
            existsCache[localeFileName] = true;
            contentsCache[localeFileName] = {
                contents: newContents,
                md5: newContentsHash,
            };
        }
    }

    const generators = {
        [FORMAT_JSON_MULTI_FILE]: generateJSONMultiFile,
        [FORMAT_JSON_SINGLE_FILE]: generateJSONSingleFile,
        [FORMAT_XLIFF12]: generateXLIFF12,
    };

    return {
        pre(file) {
            if (!file.has(MESSAGES)) {
                file.set(MESSAGES, new Map());
            }
        },

        post(file) {
            const {opts} = this;
            const {filename: fileName} = file.opts;

            const messages = file.get(MESSAGES);
            const descriptors = [...messages.values()];

            descriptors.sort(function (a, b) {
                if (a.id < b.id) {
                    return -1;
                } else if (a.id > b.id) {
                    return 1;
                } else {
                    return 0;
                }
            });

            file.metadata['react-intl'] = {messages: descriptors};

            if (descriptors.length > 0) {
                const generate = generators[opts.format || FORMAT_JSON_MULTI_FILE];

                if (!generate) {
                    throw `[React Intl] Unknown format ${opts.format}.`;
                }

                generate(file, opts, descriptors);
            }
        },

        visitor: {
            JSXOpeningElement(path, state) {
                if (wasExtracted(path)) {
                    return;
                }

                const {file, opts} = state;
                const moduleSourceName = getModuleSourceName(opts);
                const name = path.get('name');

                if (name.referencesImport(moduleSourceName, 'FormattedPlural')) {
                    file.log.warn(
                        `[React Intl] Line ${path.node.loc.start.line}: ` +
                        'Default messages are not extracted from ' +
                        '<FormattedPlural>, use <FormattedMessage> instead.'
                    );

                    return;
                }

                if (referencesImport(name, moduleSourceName, COMPONENT_NAMES)) {
                    const attributes = path.get('attributes')
                        .filter((attr) => attr.isJSXAttribute());

                    let descriptor = createMessageDescriptor(
                        attributes.map((attr) => [
                            attr.get('name'),
                            attr.get('value'),
                        ])
                    );

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
                            isJSXSource: true,
                        });

                        storeMessage(descriptor, path, state);

                        // Remove description since it's not used at runtime.
                        attributes.some((attr) => {
                            const ketPath = attr.get('name');
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

            CallExpression(path, state) {
                const moduleSourceName = getModuleSourceName(state.opts);
                const callee = path.get('callee');

                function assertObjectExpression(node) {
                    if (!(node && node.isObjectExpression())) {
                        throw path.buildCodeFrameError(
                            `[React Intl] \`${callee.node.name}()\` must be ` +
                            'called with an object expression with values ' +
                            'that are React Intl Message Descriptors, also ' +
                            'defined as object expressions.'
                        );
                    }
                }

                function processMessageObject(messageObj) {
                    assertObjectExpression(messageObj);

                    if (wasExtracted(messageObj)) {
                        return;
                    }

                    const properties = messageObj.get('properties');

                    let descriptor = createMessageDescriptor(
                        properties.map((prop) => [
                            prop.get('key'),
                            prop.get('value'),
                        ])
                    );

                    // Evaluate the Message Descriptor values, then store it.
                    descriptor = evaluateMessageDescriptor(descriptor);
                    storeMessage(descriptor, messageObj, state);

                    // Remove description since it's not used at runtime.
                    messageObj.replaceWith(t.objectExpression([
                        t.objectProperty(
                            t.stringLiteral('id'),
                            t.stringLiteral(descriptor.id)
                        ),
                        t.objectProperty(
                            t.stringLiteral('defaultMessage'),
                            t.stringLiteral(descriptor.defaultMessage || descriptor.id)
                        ),
                    ]));

                    // Tag the AST node so we don't try to extract it twice.
                    tagAsExtracted(messageObj);
                }

                if (referencesImport(callee, moduleSourceName, FUNCTION_NAMES)) {
                    const messagesObj = path.get('arguments')[0];

                    assertObjectExpression(messagesObj);

                    messagesObj.get('properties')
                        .map((prop) => prop.get('value'))
                        .forEach(processMessageObject);
                }
            },
        },
    };
}
