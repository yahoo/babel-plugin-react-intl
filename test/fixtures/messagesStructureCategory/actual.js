import React, {Component} from 'react';
import {FormattedMessage} from 'react-intl';

export default class Foo extends Component {
    render() {
        return (
            <div>
                <FormattedMessage
                    id='hello_world'
                    defaultMessage='Hello World!'
                />
                <FormattedMessage
                    id='foo.bar.baz'
                    defaultMessage='foo bar baz'
                />
            </div>
        );
    }
}
