/**
 * MCP (Model Context Protocol) Type Definitions
 */
export var MCPConnectionState;
(function (MCPConnectionState) {
    MCPConnectionState["DISCONNECTED"] = "disconnected";
    MCPConnectionState["CONNECTING"] = "connecting";
    MCPConnectionState["CONNECTED"] = "connected";
    MCPConnectionState["RECONNECTING"] = "reconnecting";
    MCPConnectionState["ERROR"] = "error";
})(MCPConnectionState || (MCPConnectionState = {}));
