# Cloud Phone H5 SDK Debug Tool

A static debug page for the VePhone H5 SDK.

## Usage

Open `index.html` directly, or serve the folder locally:

```sh
python3 -m http.server 4173
```

Then visit:

```text
http://127.0.0.1:4173/index.html
```

Use HTTPS or localhost when testing camera, microphone, clipboard, and WebRTC-related features.

## Notes

- Do not hard-code long-term credentials in this page.
- Use temporary STS credentials for SDK startup parameters.
- The local SDK file is stored at `libs/vephone-sdk.min.js`.
