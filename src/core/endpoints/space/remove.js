import operationConstants from '../../constants/operations';

import utils from '../../utils';

const endpoint = {
  getOperation: () => operationConstants.PNRemoveSpaceOperation,

  validateParams: (_, params) => {
    if (!params?.spaceId) {
      return 'spaceId cannot be empty';
    }
  },

  getURL: ({ config }, params) => `/v3/objects/${config.subscribeKey}/spaces/${utils.encodeString(params.spaceId)}`,

  useDelete: () => true,

  getRequestTimeout: ({ config }) => config.getTransactionTimeout(),

  isAuthSupported: () => true,

  prepareParams: () => ({}),

  handleResponse: (_, response) => ({
    status: response.status,
    data: response.data,
  }),
};

export default endpoint;
