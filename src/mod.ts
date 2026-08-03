import type { Context } from "aws-lambda";
import { getClient, getRules } from "./genesys/mod.ts";
import { getContext, handleRule } from "./routing/mod.ts";
import type { FunctionHandler, FunctionRequest, FunctionResponse } from "./types/mod.ts";
import { RoutingDecision } from "./types/mod.ts";

/**
 * Genesys Cloud function entry point.
 *
 * Reads the rule set from an Architect datatable, evaluates it against the inbound email named in
 * the request, and reports the outcome to the calling flow. Rules run in the order the datatable
 * returns them and evaluation stops at the first rule that produces a terminal decision — a
 * transfer, a forward, or a disconnect. Rules that only adjust priority or stage a reply do not
 * stop it, so they accumulate.
 *
 * The function decides; it does not act on the interaction. Moving the conversation is the calling
 * flow's job, which keeps every side effect on the side of the platform that can retry it — this
 * function has at most 15 seconds and no second chance.
 *
 * @param request - The conversation, message and rule table to evaluate.
 * @param context - AWS Lambda execution context, carrying the Genesys credentials.
 * @returns The decision, its target, and the audit trail of every rule considered.
 */
export const handler: FunctionHandler = async (
  request: FunctionRequest,
  context: Context,
): Promise<FunctionResponse> => {
  const client = await getClient(context);
  let routing = await getContext(request, client);
  const rules = await getRules(routing, request.datatableId);

  for (const rule of rules) {
    const { context: updated } = await handleRule(routing, rule);
    routing = updated;

    if (routing.decision) {
      break;
    }
  }

  return {
    decision: routing.decision ?? RoutingDecision.None,
    target: routing.target,
    skill: routing.skill,
    priority: routing.priority,
    replies: routing.replies,
    skipAutoReply: routing.skipAutoReply,
    executionLog: routing.executionLog,
    // POC observability: a JSON string of the per-rule audit trail, so the calling flow can bind it
    // as a single output and write it to participant data — Genesys functions have no logs of their own.
    executionLogJson: JSON.stringify(routing.executionLog ?? []),
  };
};
