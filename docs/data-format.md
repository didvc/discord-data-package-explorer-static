# Data Package Format

Discord occasionally changes the structure of the exported data package.

This tool supports both older (CSV) and newer (JSON) message formats.

## Common locations

- `messages/` — contains your messages
- `account/user.json` or similar — your account info
- Index files that map channel IDs to names

For the most up-to-date details, refer to the source code in `src/App.svelte` (the extraction logic).

If you encounter a new format that breaks the tool, please open an issue on GitHub.
