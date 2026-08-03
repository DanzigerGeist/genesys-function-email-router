import platformClient from "purecloud-platform-client-v2";
import type { FunctionRequest } from "../types/FunctionRequest.ts";
import type { RoutingContext } from "../types/RoutingContext.ts";

/**
 * Assembles the context an inbound email is judged against.
 *
 * Reads the conversation and the specific message named in the request, and constructs the API
 * clients the rule actions need. Two Platform API calls, both required before any rule can be
 * evaluated — the message supplies every field the filter language can match on.
 *
 * @param request - The routing request, naming the conversation and message.
 * @param client - Authenticated Genesys Cloud client, from `getClient`.
 * @returns The routing context, with no decision yet and an empty audit trail.
 * @throws {Error} If the conversation or message cannot be read.
 *
 * @example
 * ```ts
 * import type { Context } from "aws-lambda";
 * import { getClient } from "../genesys/mod.ts";
 * import { getContext } from "./context.ts";
 *
 * declare const context: Context;
 *
 * const client = await getClient(context);
 * const routing = await getContext(
 *   { datatableId: "table-id", conversationId: "conversation-id", messageId: "message-id" },
 *   client,
 * );
 * // routing.message.subject === "Invoice 2026-01"
 * ```
 */
export async function getContext(
  request: FunctionRequest,
  client: platformClient.ApiClientClass,
): Promise<RoutingContext> {
  const architectApi = new platformClient.ArchitectApi(client);
  const responseManagementApi = new platformClient.ResponseManagementApi(client);
  const conversationApi = new platformClient.ConversationsApi(client);

  const conversation = await conversationApi.getConversationsEmail(request.conversationId);

  // POC fork: Architect inbound email flows expose Email.ConversationID but no message id. When the
  // caller omits messageId, resolve the conversation's most recent message so the flow needs to pass
  // only the conversation id. Costs one extra list call; the variant-A optimisation removes both
  // conversation fetches by passing the message fields in from the flow directly.
  let messageId = request.messageId;
  if (!messageId) {
    const messages = await conversationApi.getConversationsEmailMessages(request.conversationId);
    const entities = messages.entities ?? [];
    messageId = entities[entities.length - 1]?.id;
    if (!messageId) {
      throw new Error("No email message found on the conversation.");
    }
  }
  const message = await conversationApi.getConversationsEmailMessage(request.conversationId, messageId);

  return {
    conversationApi,
    conversation,
    message,
    responseManagementApi,
    architectApi,
    priority: 0,
    replies: [],
    isTestMode: request.isTestMode ?? false,
  };
}
