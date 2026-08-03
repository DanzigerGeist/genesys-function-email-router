import type { ActionOutcome } from "../types/ActionOutcome.ts";
import type { RoutingContext } from "../types/RoutingContext.ts";
import type { Rule } from "../types/Rule.ts";

/**
 * Suppresses the mailbox's default auto-reply for this interaction.
 *
 * Not terminal: like a priority nudge it records intent and lets evaluation continue, so a later
 * rule can still route, forward or disconnect. It mirrors a legacy Architect email flow, where a
 * `skipAutoReply` routing rule turns the mailbox's default auto-reply off without choosing a queue
 * and a following rule (same filter) picks the destination. The calling flow reads the
 * {@linkcode FunctionResponse.skipAutoReply} flag and clears its auto-reply variable.
 *
 * @param context - The routing context as the preceding rules left it.
 * @param rule - The rule that matched; only its key is used, for the audit trail.
 * @returns The context carrying `skipAutoReply`, and the audit entry.
 *
 * @example
 * ```ts
 * import type { RoutingContext, Rule } from "../types/mod.ts";
 * import { handleSkipAutoReply } from "./handleSkipAutoReply.ts";
 *
 * declare const context: RoutingContext;
 * declare const rule: Rule;
 *
 * const { context: updated } = await handleSkipAutoReply(context, rule);
 * // updated.skipAutoReply === true; updated.decision stays unset, so evaluation continues.
 * ```
 */
export function handleSkipAutoReply(context: RoutingContext, rule: Rule): Promise<ActionOutcome> {
  return Promise.resolve({
    context: { ...context, skipAutoReply: true },
    result: {
      id: rule.key,
      isValid: true,
      isMatched: true,
      isSuccessful: true,
    },
  });
}
