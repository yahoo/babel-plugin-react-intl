import React, {Component} from 'react';
import {defineMessages, FormattedMessage} from 'react-intl';

const msgs = defineMessages({
    header: {
        id: 'foo.bar.baz',
        defaultMessage: 'Hello World!',
        description: 'The default message'
    },
    saveFile: {
        id: 'delete',
        defaultMessage: 'delete',
        description: 'delete file'
    },
    content: {
        id: 'foo.bar.biff',
        defaultMessage: 'Hello Nurse!',
        description: 'Another message'
    },
    delete: {
        id: 'delete',
        defaultMessage: 'delete',
        description: 'delete file'
    },
    downloadFile: {
        id: 'download',
        defaultMessage: 'download file',
        description: 'download file'
    },
    backToHome: {
        id: 'backToHome',
        defaultMessage: 'back',
        description: 'back text'
    }
});

export default class Foo extends Component {
    render() {
        return (
            <div>
                <a href="/"><FormattedMessage {...msgs.backToHome}/></a>
                <h1><FormattedMessage {...msgs.header}/></h1>
                <p><FormattedMessage {...msgs.content}/></p>
                <a href="/"><FormattedMessage {...msgs.downloadFile}/></a>
                <a href="/"><FormattedMessage {...msgs.downloadFile}/></a>
            </div>
        );
    }
}
