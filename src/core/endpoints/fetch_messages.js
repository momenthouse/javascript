import operationConstants from '../constants/operations';
import utils from '../utils';

function __processMessage(modules, message) {
  const { config, crypto } = modules;
  if (!config.cipherKey) return message;

  try {
    return crypto.decrypt(message);
  } catch (e) {
    return message;
  }
}

function __getPNMessageTypeString(messageTypeInt) {
  switch (messageTypeInt) {
    case 0:
      return 'pn_message';
    case 3:
      return 'pn_messageAction';
    case 4:
      return 'pn_file';
    case null:
      return 'pn_message';
    default:
      return `${messageTypeInt}`;
  }
}

export function getOperation() {
  return operationConstants.PNFetchMessagesOperation;
}

export function validateParams(modules, incomingParams) {
  const { channels, includeMessageActions = false } = incomingParams;
  const { config } = modules;

  if (!channels || channels.length === 0) return 'Missing channels';
  if (!config.subscribeKey) return 'Missing Subscribe Key';

  if (includeMessageActions && channels.length > 1) {
    throw new TypeError(
      'History can return actions data for a single channel only. ' +
        'Either pass a single channel or disable the includeMessageActions flag.',
    );
  }
}

export function getURL(modules, incomingParams) {
  const { channels = [], includeMessageActions = false } = incomingParams;
  const { config } = modules;
  const endpoint = !includeMessageActions ? 'history' : 'history-with-actions';

  const stringifiedChannels = channels.length > 0 ? channels.join(',') : ',';
  return `/v3/${endpoint}/sub-key/${config.subscribeKey}/channel/${utils.encodeString(stringifiedChannels)}`;
}

export function getRequestTimeout({ config }) {
  return config.getTransactionTimeout();
}

export function isAuthSupported() {
  return true;
}

export function prepareParams(modules, incomingParams) {
  const {
    channels,
    start,
    end,
    includeMessageActions,
    count,
    stringifiedTimeToken = false,
    includeMeta = false,
    includeUuid,
    includeUUID = true,
    includeMessageType = true,
    includeSpaceId = false,
  } = incomingParams;
  const outgoingParams = {};
  outgoingParams.include_message_type = 'true';
  outgoingParams.include_type = 'true';
  if (count) {
    outgoingParams.max = count;
  } else {
    outgoingParams.max = channels.length > 1 || includeMessageActions === true ? 25 : 100;
  }
  if (start) outgoingParams.start = start;
  if (end) outgoingParams.end = end;
  if (stringifiedTimeToken) outgoingParams.string_message_token = 'true';
  if (includeMeta) outgoingParams.include_meta = 'true';
  if (includeUUID && includeUuid !== false) outgoingParams.include_uuid = 'true';
  if (!includeMessageType) {
    outgoingParams.include_message_type = 'false';
    outgoingParams.include_type = 'false';
  }
  if (includeSpaceId) outgoingParams.include_space_id = 'true';

  return outgoingParams;
}

export function handleResponse(modules, serverResponse) {
  const response = {
    channels: {},
  };

  Object.keys(serverResponse.channels || {}).forEach((channelName) => {
    response.channels[channelName] = [];

    (serverResponse.channels[channelName] || []).forEach((messageEnvelope) => {
      const announce = {};
      announce.channel = channelName;
      announce.timetoken = messageEnvelope.timetoken;
      announce.message = __processMessage(modules, messageEnvelope.message);
      announce.uuid = messageEnvelope.uuid;

      if (messageEnvelope.actions) {
        announce.actions = messageEnvelope.actions;

        // This should be kept for few updates for existing clients consistency.
        announce.data = messageEnvelope.actions;
      }
      if (messageEnvelope.meta) {
        announce.meta = messageEnvelope.meta;
      }
      if (typeof messageEnvelope.message_type != 'undefined' || messageEnvelope.type) {
        announce.messageType = messageEnvelope.type || __getPNMessageTypeString(messageEnvelope.message_type);
      }

      if (messageEnvelope.space_id) {
        announce.spaceId = messageEnvelope.space_id;
      }

      response.channels[channelName].push(announce);
    });
  });
  if (serverResponse.more) {
    response.more = serverResponse.more;
  }

  return response;
}
