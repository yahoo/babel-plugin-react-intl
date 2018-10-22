import React, {Component} from 'react';
import {defineMessages, FormattedMessage} from 'react-intl';

const msgs = defineMessages({
    back: {
        id: 'back',
        defaultMessage: 'back',
        description: 'back text'
    }
});

export default class Foo extends Component {
    render() {
        return (
            <div>
                <a href="/"><FormattedMessage {...msgs.back}/></a>
            </div>
        );
    }
}
