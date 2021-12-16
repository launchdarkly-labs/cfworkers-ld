import {
  getAssetFromKV,
  mapRequestToAsset,
} from "@cloudflare/kv-asset-handler";
const { init } = require("launchdarkly-cloudflare-edge-sdk");

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false;

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

class ElementHandler {
  async element(element) {
    const headerText = await getFlagValue("header-text");
    element.setInnerContent(headerText);
  }
}
const rewriter = new HTMLRewriter();
rewriter.on("h1", new ElementHandler());
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

  /**
   * You can add custom logic to how we fetch your assets
   * by configuring the function `mapRequestToAsset`
   */
  // options.mapRequestToAsset = handlePrefix(/^\/docs/)

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true,
      };
    }

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
    response.headers.set("Feature-Policy", "none");

    return rewriter.transform(response);
  } catch (e) {
    console.log(e);
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: (req) =>
            new Request(`${new URL(req.url).origin}/404.html`, req),
        });

        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 404,
        });
      } catch (e) {}
    }

    return new Response(e.message || e.toString(), { status: 500 });
  }
}
