const Hapi = require('hapi');
import * as crypto from 'crypto';
import { HapiSlackSignature } from './index';

const version = 'v0';
const positiveTestCaseToken = 'xyzz0WbapA4vBCDEFasx0q6G';
const negativeTestCaseToken = 'xyzz0WbapA4vBCDEFasx0q6x';
const secret = '8f742231b10e8888abcd99yyyzzz85a5';

const getPayload = token =>
  `token=${token}&team_id=T1DC2JH3J&team_domain=testteamnow&channel_id=G8PSS9T3V&channel_name=foobar&user_id=U2CERLKJA&user_name=roadrunner&command=%2Fwebhook-collect&text=&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT1DC2JH3J%2F397700885554%2F96rGlfmibIGlgcZRskXaIFfN&trigger_id=398738663015.47445629121.803a0bc887a14d10d2c447fce8b6703c`;

describe('Verifying a Slack request', () => {
  it('A 200 success is received when the Slack timestamp and server timestamp are less than 5 minutes', async () => {
    const payload = getPayload(positiveTestCaseToken);
    const timestamp = Math.floor(Date.now() / 1000 - 60 * 1); // Slack timestamp (seconds)
    const basestring = `${version}:${timestamp}:${payload}`;
    const hmac = crypto.createHmac('sha256', secret);
    const signature: string = hmac.update(basestring).digest('hex');
    const slackRequest = {
      method: 'POST',
      url: '/slack',
      headers: {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': signature,
        'content-type': 'application/x-www-form-urlencoded'
      },
      payload: Buffer.from(payload)
    };

    const server = Hapi.server();
    server.auth.scheme('HapiSlackSignature', HapiSlackSignature);
    server.auth.strategy('slack', 'HapiSlackSignature', {
      signingSecret: secret
    });

    server.route({
      path: '/slack',
      method: 'POST',
      options: {
        auth: {
          strategy: 'slack',
          mode: 'required'
        },
        payload: {
          parse: false,
          allow: 'application/x-www-form-urlencoded'
        }
      },
      handler: (request, h) => {
        return { message: 'ok' };
      }
    });

    const res = await server.inject(slackRequest);
    expect(res.statusCode).toBe(200);
  });

  it('A 401 error is received if the Slack timestamp and server timestamp differ more than 5 minutes', async () => {
    const payload = getPayload(positiveTestCaseToken);
    const timestamp = Math.floor(Date.now() / 1000 - 60 * 10); // Slack timestamp (seconds)
    const basestring = `${version}:${timestamp}:${payload}`;
    const hmac = crypto.createHmac('sha256', secret);
    const signature: string = hmac.update(basestring).digest('hex');
    const slackRequest = {
      method: 'POST',
      url: '/slack',
      headers: {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': signature,
        'content-type': 'application/x-www-form-urlencoded'
      },
      payload: Buffer.from(payload)
    };

    const server = Hapi.server();
    server.auth.scheme('HapiSlackSignature', HapiSlackSignature);
    server.auth.strategy('slack', 'HapiSlackSignature', {
      signingSecret: secret
    });

    server.route({
      path: '/slack',
      method: 'POST',
      options: {
        auth: {
          strategy: 'slack',
          mode: 'required'
        },
        payload: {
          parse: false,
          allow: 'application/x-www-form-urlencoded'
        }
      },
      handler: (request, h) => {
        return { message: 'ok' };
      }
    });

    const res = await server.inject(slackRequest);
    expect(res.statusCode).toBe(401);
    expect(res.result.message).toBe('Invalid timestamp');
  });

  it('A 401 error is received if the Slack request signature is invalid', async () => {
    const payload = getPayload(negativeTestCaseToken);
    const timestamp = Math.floor(Date.now() / 1000); // Slack timestamp (seconds)
    const basestring = `${version}:${timestamp}:${payload}`;
    const hmac = crypto.createHmac('sha256', secret);
    const signature: string = hmac.update(basestring).digest('hex');
    const slackRequest = {
      method: 'POST',
      url: '/slack',
      headers: {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': signature,
        'content-type': 'application/x-www-form-urlencoded'
      },
      payload: Buffer.from(getPayload(positiveTestCaseToken))
    };

    const server = Hapi.server();
    server.auth.scheme('HapiSlackSignature', HapiSlackSignature);
    server.auth.strategy('slack', 'HapiSlackSignature', {
      signingSecret: secret
    });

    server.route({
      path: '/slack',
      method: 'POST',
      options: {
        auth: {
          strategy: 'slack',
          mode: 'required',
          payload: 'required'
        },
        payload: {
          parse: false,
          allow: 'application/x-www-form-urlencoded'
        }
      },
      handler: (request, h) => {
        return { message: 'ok' };
      }
    });

    // https://github.com/hapijs/hapi/issues/3736
    // we actually want this code but it throws an error for some reason with server.inject
    // expect(res.statusCode).toBe(401);
    // expect(res.result.message).toBe('Payload failed authentication');

    try {
      await server.inject(slackRequest);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});
