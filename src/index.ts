import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import { init, LDClient } from "launchdarkly-cloudflare-edge-sdk";

// Declare MY_KV as a global variable
declare global {
  var MY_KV: KVNamespace;
}

let ldClient: LDClient;

class FlagsStateInjector {
  async element(element: Element) {
      // fetch all flag values for client-side SDKs 
      // as evaluated for a context that has not logged in
      // use a more appropriate context key if needed
    const context = { key: 'guest' };
    const allFlags = await ldClient.allFlagsState(context, {
      clientSideOnly: true,
    });
    element.append(
      `<script>window.ldFlags = ${JSON.stringify(allFlags)}</script>`,
      { html: true }
    );
  }
}

class H1ElementHandler {
  async element(element: Element) {
    // replace the header text with the value of a string flag
    const headerText = await getFlagValue("header-text");
    element.setInnerContent(headerText);
  }
}

const rewriter = new HTMLRewriter();
rewriter.on("head", new FlagsStateInjector());
rewriter.on("h1", new H1ElementHandler());

async function getFlagValue(key: string, context?) {
  let flagValue;
  if (!context) {
    context = {
      key: 'guest',
    };
  }
  flagValue = await ldClient.variation(key, context, false);
  return flagValue;
}

addEventListener("fetch", (event) => {
  event.respondWith(handleEvent(event));
});

async function handleEvent(event: FetchEvent) {
  if (!ldClient) {
    ldClient = init(MY_KV, "63455fcfeffc3d114a12c3bd", {});
    await ldClient.waitForInitialization();
  }

  let options = {};
  try {
    const page = await getAssetFromKV(event, options);
    const response = new Response(page.body, page);

    const customHeader = await getFlagValue("custom-response-headers");
    customHeader.headers.forEach((header: { name: string; value: string }) => {
      response.headers.set(header.name, header.value);
    });

    return rewriter.transform(response);
  } catch (e: any) {
    console.log(e);
    return new Response(e.message || e.toString(), { status: 500 });
  }
}
