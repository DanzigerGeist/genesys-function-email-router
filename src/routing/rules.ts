import {
  handleDisconnect,
  handleForward,
  handlePriorityDecrease,
  handlePriorityIncrease,
  handlePrioritySet,
  handleReply,
  handleRoute,
  handleSkipAutoReply,
} from "../actions/mod.ts";
import { evaluateFilter } from "../filters/evaluate.ts";
import type { ActionHandler } from "../types/ActionHandler.ts";
import type { ActionOutcome } from "../types/ActionOutcome.ts";
import type { ActionResult } from "../types/ActionResult.ts";
import type { RoutingContext } from "../types/RoutingContext.ts";
import type { Rule } from "../types/Rule.ts";
import { RuleAction } from "../types/RuleAction.ts";

/** Dispatch table from a rule's declared action to the handler that performs it. */
const HANDLERS: Readonly<Record<RuleAction, ActionHandler>> = {
  [RuleAction.Disconnect]: handleDisconnect,
  [RuleAction.Forward]: handleForward,
  [RuleAction.PriorityDecrease]: handlePriorityDecrease,
  [RuleAction.PriorityIncrease]: handlePriorityIncrease,
  [RuleAction.PrioritySet]: handlePrioritySet,
  [RuleAction.Reply]: handleReply,
  [RuleAction.Route]: handleRoute,
  [RuleAction.SkipAutoReply]: handleSkipAutoReply,
};

/**
 * Looks up the handler for a rule's action.
 *
 * Rules arrive from a datatable, so the action column holds whatever an administrator typed. The
 * lookup is deliberately defensive rather than trusting the {@linkcode RuleAction} type: an
 * unrecognised value yields `undefined` and is reported as an invalid rule, not thrown.
 */
function findHandler(action: RuleAction | undefined): ActionHandler | undefined {
  if (action === undefined) {
    return undefined;
  }

  return Object.hasOwn(HANDLERS, action) ? HANDLERS[action] : undefined;
}

/** Appends a result to the context's audit trail, returning a new context. */
function record(context: RoutingContext, result: ActionResult): ActionOutcome {
  return {
    context: { ...context, executionLog: [...(context.executionLog ?? []), result] },
    result,
  };
}

/**
 * Evaluates one rule and, if it applies, executes it.
 *
 * The sequence is fixed: a disabled rule is skipped, then the filter runs, then the action. Every
 * path appends exactly one {@linkcode ActionResult} to the context's audit trail — including the
 * paths that do nothing — because that trail is the only account of the run that survives into
 * production, where the function emits no logs.
 *
 * A filter that throws is treated as not matching rather than as a failure of the whole run. One
 * malformed expression in a datatable should not take the rule set with it, and the parse error is
 * preserved on the result so it is still visible.
 *
 * @param context - The routing context as the preceding rules left it.
 * @param rule - The rule to evaluate.
 * @returns The updated context, and the result appended to its audit trail.
 *
 * @example
 * ```ts
 * import type { RoutingContext, Rule } from "../types/mod.ts";
 * import { handleRule } from "./rules.ts";
 *
 * declare const context: RoutingContext;
 * declare const rule: Rule;
 *
 * const { context: updated, result } = await handleRule(context, rule);
 * // result.isMatched === true when the rule's filter passed
 * ```
 */
export async function handleRule(context: RoutingContext, rule: Rule): Promise<ActionOutcome> {
  const startedAt = Date.now();

  /** Stamps the timing every result carries, so no branch can forget it. */
  const finish = (result: Omit<ActionResult, "startedAt" | "endedAt" | "duration">): ActionResult => {
    const endedAt = Date.now();
    return { ...result, startedAt, endedAt, duration: endedAt - startedAt };
  };

  if (!rule.enabled) {
    return record(
      context,
      finish({ id: rule.key, isValid: true, isMatched: false, isSuccessful: false, message: "Rule is disabled." }),
    );
  }

  let isMatched = true;
  let filterError: unknown = undefined;

  if (rule.filter) {
    try {
      isMatched = evaluateFilter(context, rule.filter);
    } catch (error) {
      isMatched = false;
      filterError = error;
    }
  }

  const handler = findHandler(rule.action);

  if (!handler) {
    return record(
      context,
      finish({
        id: rule.key,
        isValid: false,
        isMatched,
        isSuccessful: false,
        message: `Unsupported or missing action type: ${String(rule.action)}`,
        error: filterError,
      }),
    );
  }

  if (!isMatched) {
    return record(
      context,
      finish({
        id: rule.key,
        isValid: true,
        isMatched: false,
        isSuccessful: false,
        message: filterError ? "Filter evaluation error" : "Filter did not match",
        error: filterError,
      }),
    );
  }

  const { context: updated, result } = await handler(context, rule);

  // The handler's own result is kept intact. `filterError` is deliberately not merged in here: this
  // path is reachable only when the filter did not throw, so merging it could only ever overwrite
  // the handler's error with `undefined` — which is how a failed forward used to lose its cause.
  return record(updated, finish({ ...result, isMatched: true }));
}
