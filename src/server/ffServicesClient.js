const {
  ServerToServerTokenProvider,
} = require('@adobe/firefly-services-common-apis')

/**
 * Shamelessly stolen from https://github.com/Firefly-Services/firefly-services-sdk-js?tab=readme-ov-file, with modifications
 */
export default function createFFClientConfig(clientId, clientSecret, scopes) {
  const authProvider = new ServerToServerTokenProvider(
    {
      clientId,
      clientSecret,
      scopes, // e.g.: "openid,AdobeID,read_organizations,firefly_api,ff_apis"
    },
    {
      autoRefresh: true,
    },
  )
  const config = {
    tokenProvider: authProvider,
    clientId: clientId,
  }

  // This is passed to the respective FF Services clients.
  // e.g.:
  // const photoshop = new PhotoshopClient(config);
  return config
}
