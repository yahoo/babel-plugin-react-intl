import React, {Component} from 'react';

export default class Foo extends Component {
    render() {
        const {intl} = this.props;

        return (
            <div>
                {intl.formatMessage({
                    id: 'foo.bar.baz',
                    defaultMessage: 'Hello World!',
                    description: 'The default message.',
                })}
            </div>
        );
    }
}
