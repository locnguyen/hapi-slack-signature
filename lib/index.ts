import * as crypto from 'crypto';
import * as Boom from 'boom';
import * as Hapi from 'hapi';

const isOldTimestamp = (timestamp: number): boolean =>
  Math.abs(new Date().getTime() - timestamp) > 1000 * 60 * 5;

const getSlackHeaders = (headers: Hapi.Util.Dictionary<string>) => ({
  slackTimestamp: headers['x-slack-request-timestamp'],
  slackSignature: headers['x-slack-signature']
});

const HapiSlackSignature = (server, options): Hapi.ServerAuthSchemeObject => ({
  authenticate: (request, h) => {
    const { slackTimestamp, slackSignature } = getSlackHeaders(request.headers);

    if (!slackTimestamp || !slackSignature) {
      throw Boom.unauthorized('Missing required Slack headers');
    } else if (isOldTimestamp(parseInt(slackTimestamp, 10))) {
      h.unauthenticated(Boom.unauthorized('Timestamp invalid'));
      throw Boom.unauthorized('Invalid timestamp');
    } else {
      return h.authenticated({
        credentials: { slackTimestamp, slackSignature }
      });
    }
  },
  payload: (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { slackTimestamp, slackSignature } = getSlackHeaders(request.headers);
    const payloadBuffer = request.payload;
    const [version, hash] = slackSignature.split('=');

    const signatureBaseString = [version, slackTimestamp, payloadBuffer.toString()].join(':');

    const hmac = crypto.createHmac('sha256', options.signingSecret);
    const signature = hmac.update(signatureBaseString).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(hash, 'hex'))) {
      return h.continue;
    } else {
      return Boom.unauthorized('Payload failed authentication');
    }
  }
});

export { HapiSlackSignature };
