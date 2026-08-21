import noRawColor from './no-raw-color.js'
import noHardcodedApiPath from './no-hardcoded-api-path.js'
import noDirectFetch from './no-direct-fetch.js'
import noServerValueImportInClient from './no-server-value-import-in-client.js'
import noNewServerFn from './no-new-server-fn.js'
import noResponseOutsideHttpLayer from './no-response-outside-http-layer.js'
import requireDataTestid from './require-data-testid.js'

export default {
  rules: {
    'no-raw-color': noRawColor,
    'no-hardcoded-api-path': noHardcodedApiPath,
    'no-direct-fetch': noDirectFetch,
    'no-server-value-import-in-client': noServerValueImportInClient,
    'no-new-server-fn': noNewServerFn,
    'no-response-outside-http-layer': noResponseOutsideHttpLayer,
    'require-data-testid': requireDataTestid,
  },
}
