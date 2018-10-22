import React, {Component} from 'react';
import {defineMessages, FormattedMessage} from 'react-intl';

const msgs = defineMessages({
    download: {
        id: 'download',
        defaultMessage: 'download ',
        description: 'download item'
    }
});

export default class Foo extends Component {
    render() {
        return (
            <div>
                <a href="/"><FormattedMessage {...msgs.download}/></a>
            </div>
        );
    }
}
