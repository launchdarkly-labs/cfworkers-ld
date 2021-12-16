import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
const { init } = require("launchdarkly-cloudflare-edge-sdk");

class FlagsStateInjector {
  async element(element) {
    // fetch all flag values for client-side SDKs as evaluated for an anonymous user
    // use a more appropriate user key if needed
    const user = { key: "anonymous" };
    const allFlags = await ldClient.allFlagsState(user, {
      clientSideOnly: true,
    });
    element.append(
      `<script>window.ldFlags = ${JSON.stringify(allFlags)}</script>`,
      { html: true }
    );
  }
}

class H1ElementHandler {
  async element(element) {
    // replace the header text with the value of a string flag
    const headerText = await getFlagValue("header-text");
    element.setInnerContent(headerText);
  }
}
const rewriter = new HTMLRewriter();
rewriter.on("h1", new H1ElementHandler());
rewriter.on("head", new FlagsStateInjector());
let ldClient;

addEventListener("fetch", (event) => {
  event.respondWith(handleEvent(event));
});

async function getFlagValue(key, user) {
  let flagValue;
  if (!user) {
    user = {
      key: "anonymous",
    };
  }
  flagValue = await ldClient.variation(key, user, false);
  return flagValue;
}

async function handleEvent(event) {
  let options = {};

  try {
    if (!ldClient) {
      ldClient = init(MY_KV, "61409b046ca8d52601d179ef");
      await ldClient.waitForInitialization();
    }

    const page = await getAssetFromKV(event, options);

    // allow headers to be altered
    const response = new Response(page.body, page);

    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "unsafe-url");

    return rewriter.transform(response);
  } catch (e) {
    console.log(e);
    return new Response(e.message || e.toString(), { status: 500 });
  }
}
