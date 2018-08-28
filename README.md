# hapi-slack-signature

[![pipeline status](https://gitlab.com/lochnguyen/hapi-slack-signature/badges/master/pipeline.svg)](https://gitlab.com/lochnguyen/hapi-slack-signature/commits/master) [![coverage report](https://gitlab.com/lochnguyen/hapi-slack-signature/badges/master/coverage.svg)](https://gitlab.com/lochnguyen/hapi-slack-signature/commits/master)

This HapiJS authentication scheme authenticates requests from the Slack Event API. It has a peer dependency on HapiJS `>=17.x.x`.

To learn more about request verification, see the Slack [documentation](https://api.slack.com/docs/verifying-requests-from-slack).

## Installation

```shell
$ npm install --save hapi-slack-signature
```

## Usage

```nodejs
const server = Hapi.server({ port: 8080 });

server.auth.scheme('HapiSlackSignature', HapiSlackSignature);

server.auth.strategy('slack', 'HapiSlackSignature', { signingSecret: 'secret_from_slack' });

server.route({
  path: '/slack',
  method: 'POST',
  options: {
    auth: {
      strategy: 'slack',
      mode: 'required,
      payload: 'required'
    },
    payload: {
      parse: false,
      allow: 'application/x-www-form-urlencoded'
    }
  },
  handler: (request, h) => {
    return { message: 'ok };
  }
});
```

## Test

To run the tests and get coverage, run `npm install` and then `npm test`

## Build

To build this package run `npm install` and then `npm run build`. The artifacts can be found in `build/`.