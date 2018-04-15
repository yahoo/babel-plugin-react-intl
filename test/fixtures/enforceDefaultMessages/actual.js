import React, {Component} from 'react';
import {defineMessages, FormattedMessage} from 'react-intl';


const msgs = defineMessages({
    content: {
        id: 'foo.bar.biff',
    },
});

export default class Foo extends Component {
    render() {
        return (
            <div>
                {msgs}
                <FormattedMessage
                    id='foo.bar.baz'
                />
            </div>
        );
    }
}
