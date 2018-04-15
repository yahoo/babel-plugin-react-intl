import React, {Component} from 'react';
import {FormattedMessage} from 'react-intl';

export default class Foo extends Component {
    render() {
        return (
            <div>
                <FormattedMessage
                    id='lorem_ipsum'
                    defaultMessage='Lorem ipsum'
                />
                <FormattedMessage
                    id='foo.aar'
                    defaultMessage='foo aar'
                />
            </div>
        );
    }
}
