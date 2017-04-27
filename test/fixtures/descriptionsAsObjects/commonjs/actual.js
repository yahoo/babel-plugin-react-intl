import React, {Component} from 'react';

const reactIntl = require('react-intl');

export default class Foo extends Component {
    render() {
        return (
            <reactIntl.FormattedMessage
                id='foo.bar.baz'
                defaultMessage='Hello World!'
                description={{
                    text: 'Something for the translator.',
                    metadata: 'Additional metadata content.',
                }}
            />
        );
    }
}
