# Cloudflare Assessment Blueprints

These `.gadget` archives are reusable, read-only assessment templates exported from the LATAM workshop instance.

## Import

1. Open the target workshop instance and select **Blueprints**.
2. Select **Upload** and choose one `.gadget` archive from this directory.
3. Open `manifest.json` and configure the exact `requiredBindings` and `expectedEndpoints` listed for the selected archive. The Radar Intelligence Blueprint uses only `MCP_RADAR`; the other assessment Blueprints use `MCP_CLOUDFLARE`, `MCP_AUDITLOGS`, and `MCP_OBSERVABILITY`.
4. Reconnect every binding with the participant's own identity. Connections and credentials are never included in the archive.
5. Create a workspace from the imported Blueprint, run one harmless validation read, and keep the report status as `Draft, review required` until evidence and release gates are reviewed.

## Export

1. Finish the Gadget setup, representative success test, no-data test, tool-error test, evidence-attribution review, and output review.
2. Accept changes only after all blocking checks pass.
3. Publish the Blueprint with its catalog title and description.
4. Open the published Blueprint, select **More blueprint actions**, then **Download archive**.
5. Save the archive as `<Blueprint-Title>-v1.gadget` and record its public Blueprint ID and URL.
6. Verify magic bytes, size, and SHA-256 before adding or updating the manifest.

## Integrity

`manifest.json` records the source Blueprint IDs, public URLs, archive sizes, and SHA-256 checksums. Verify an archive before importing it:

```sh
shasum -a 256 blueprints/*.gadget
```

The archives contain source code and binding requirements. They do not contain credentials, live connections, chat history, or persisted Gadget storage.
