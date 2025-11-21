/**
 * MCP (Model Context Protocol) Type Definitions
 */
export var MCPConnectionState;
(function (MCPConnectionState) {
  MCPConnectionState['DISCONNECTED'] = 'disconnected';
  MCPConnectionState['CONNECTING'] = 'connecting';
  MCPConnectionState['CONNECTED'] = 'connected';
  MCPConnectionState['RECONNECTING'] = 'reconnecting';
  MCPConnectionState['ERROR'] = 'error';
})(MCPConnectionState || (MCPConnectionState = {}));

/**
 * Standard MCP Error Codes and Messages
 */
export var MCPErrors;
(function (MCPErrors) {
  MCPErrors[(MCPErrors['GENERIC_ERROR'] = -32000)] = 'GENERIC_ERROR';
  MCPErrors[(MCPErrors['REQUEST_TIMEOUT'] = -32001)] = 'REQUEST_TIMEOUT';
  MCPErrors[(MCPErrors['HTTP_REQUEST_FAILED'] = -32002)] = 'HTTP_REQUEST_FAILED';
  MCPErrors[(MCPErrors['NOT_CONNECTED'] = -32003)] = 'NOT_CONNECTED';
  MCPErrors[(MCPErrors['INVALID_REQUEST'] = -32004)] = 'INVALID_REQUEST';
  MCPErrors[(MCPErrors['AUTHENTICATION_FAILED'] = -32005)] = 'AUTHENTICATION_FAILED';
  MCPErrors[(MCPErrors['RATE_LIMIT_EXCEEDED'] = -32006)] = 'RATE_LIMIT_EXCEEDED';
  MCPErrors[(MCPErrors['SERVICE_UNAVAILABLE'] = -32007)] = 'SERVICE_UNAVAILABLE';
  MCPErrors[(MCPErrors['CONFIGURATION_ERROR'] = -32008)] = 'CONFIGURATION_ERROR';
})(MCPErrors || (MCPErrors = {}));

/**
 * Standard MCP Error Messages
 */
export const MCPErrorMessages = {
  [MCPErrors.GENERIC_ERROR]: 'An unexpected error occurred',
  [MCPErrors.REQUEST_TIMEOUT]: 'Request timed out',
  [MCPErrors.HTTP_REQUEST_FAILED]: 'HTTP request failed',
  [MCPErrors.NOT_CONNECTED]: 'MCP client is not connected',
  [MCPErrors.INVALID_REQUEST]: 'Invalid request parameters',
  [MCPErrors.AUTHENTICATION_FAILED]: 'Authentication failed',
  [MCPErrors.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [MCPErrors.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable',
  [MCPErrors.CONFIGURATION_ERROR]: 'Configuration error',
};

/**
 * Creates a standardized MCP error object
 * @param code - The error code
 * @param message - Optional custom message (defaults to standard message)
 * @param data - Optional additional error data
 * @returns Standardized error object
 */
export function createMCPError(code, message, data) {
  return {
    code,
    message: message || MCPErrorMessages[code] || 'Unknown error',
    data,
  };
}
