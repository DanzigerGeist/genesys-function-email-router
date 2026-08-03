/**
 * Rule action handlers.
 *
 * One handler per {@linkcode RuleAction}. Each takes the routing context and the rule that matched,
 * applies the rule's effect, and reports what happened. Handlers are dispatched by
 * `handleRule` in `../routing/rules.ts`; nothing here evaluates a filter or decides whether a rule
 * applies.
 *
 * @module
 */

export { handleDisconnect } from "./handleDisconnect.ts";
export { handleForward } from "./handleForward.ts";
export { handlePriorityDecrease } from "./handlePriorityDecrease.ts";
export { handlePriorityIncrease } from "./handlePriorityIncrease.ts";
export { handlePrioritySet } from "./handlePrioritySet.ts";
export { handleReply } from "./handleReply.ts";
export { handleRoute } from "./handleRoute.ts";
export { handleSkipAutoReply } from "./handleSkipAutoReply.ts";
