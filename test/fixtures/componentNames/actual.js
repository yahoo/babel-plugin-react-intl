import React, {Component} from 'react';
import DefaultMessage, {Message} from 'react-i18n';

export default class Foo extends Component {
    render() {
        return (
            <div>
                <DefaultMessage
                    id='foo.bar.baz'
                    defaultMessage='Hello World!'
                    description='The default message.'
                />
                <Message
                    id='foo.bar'
                    defaultMessage='Foo bar!'
                />
            </div>
        );
    }
}
