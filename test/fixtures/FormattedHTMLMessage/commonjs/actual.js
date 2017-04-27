import React, {Component} from 'react';

const reactIntl = require('react-intl');

export default class Foo extends Component {
    render() {
        return (
            <reactIntl.FormattedHTMLMessage
                id='foo.bar.baz'
                defaultMessage='<h1>Hello World!</h1>'
                description='The default message.'
            />
        );
    }
}
