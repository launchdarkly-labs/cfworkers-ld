import { init as initLD, LDClient } from '@launchdarkly/cloudflare-server-sdk';
import { ExecutionContext, KVNamespace, Request, Response } from '@cloudflare/workers-types';

interface Bindings {
  LD_KV: KVNamespace;
}

let ldClient: LDClient;

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    const sdkKey = 'test-sdk-key';
    const flagKey = 'testFlag1';
    const context = { kind: 'user', key: 'test-user-key-1', email: 'test@gmail.com' };

    ldClient = initLD(sdkKey, env.LD_KV);
    await ldClient.waitForInitialization();
    const flagValue = await ldClient.variation(flagKey, context, false);
    const flagDetail = await ldClient.variationDetail(flagKey, context, false);
    const allFlags = await ldClient.allFlagsState(context);

    const resp = `
    ${flagKey}: ${flagValue}
    detail: ${JSON.stringify(flagDetail)}
    allFlags: ${JSON.stringify(allFlags)}`;
    return new Response(`${resp}`);
  },
};
