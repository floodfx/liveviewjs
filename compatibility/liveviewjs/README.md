# LiveViewJS differential target

This minimal Node/Express application implements the same scenarios as the
pinned Phoenix reference oracle. It serves the exact pinned Phoenix LiveView
browser client locally and advertises that version in the LiveView join reply.

The build bundles the repository TypeScript sources so the compatibility check
always exercises the changes under review rather than a previously generated
package artifact.
