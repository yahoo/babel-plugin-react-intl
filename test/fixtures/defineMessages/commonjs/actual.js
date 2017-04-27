import React, {Component} from 'react';

const reactIntl = require('react-intl');

const msgs = reactIntl.defineMessages({
    header: {
        id: 'foo.bar.baz',
        defaultMessage: 'Hello World!',
        description: 'The default message',
    },
    content: {
        id: 'foo.bar.biff',
        defaultMessage: 'Hello Nurse!',
        description: 'Another message',
    },
});

export default class Foo extends Component {
    render() {
        return (
            <div>
                <h1><reactIntl.FormattedMessage {...msgs.header}/></h1>
                <p><reactIntl.FormattedMessage {...msgs.content}/></p>
            </div>
        );
    }
}
