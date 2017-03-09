import React, {Component} from 'react';
import {FormattedMessage, defineMessages} from 'react-intl';

const message = defineMessages({
  foo: {
    id: 'foo.bar.bar',
    defaultMessage: 'Hello Everybody!',
    meta: { html: true }
  }
})

export default class Foo extends Component {
    render() {
        return (
          <div>
            <FormattedMessage
                id='foo.bar.baz'
                defaultMessage='Hello World!'
                meta={{ html: true }}
            />
            <FormattedMessage
                {...message.foo}
            />
          </div>
        );
    }
}
