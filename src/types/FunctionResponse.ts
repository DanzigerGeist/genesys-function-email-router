import type { ActionResult } from "./ActionResult.ts";
import type { RoutingDecision } from "./RoutingDecision.ts";

/**
 * Describes the output payload returned by the Genesys Cloud function.
 *
 * The function reports intent rather than acting on the interaction itself: the calling Architect
 * flow reads {@linkcode FunctionResponse.decision} and moves the conversation accordingly.
 */
export type FunctionResponse = Readonly<{
  /**
   * The outcome the flow should act on.
   *
   * {@linkcode RoutingDecision.None} means no rule produced a terminal decision, which is a
   * successful run rather than a failure — the flow continues on its default path.
   */
  decision: RoutingDecision;

  /** Queue name, flow state, or email address the decision applies to. */
  target?: string | undefined;

  /** Skill to require when routing the interaction. */
  skill?: string | undefined;

  /** Priority accumulated by the rules that matched. Higher sorts first. */
  priority?: number | undefined;

  /** Canned response text staged for the flow to deliver. */
  replies?: string[] | undefined;

  /**
   * Whether a matched skipAutoReply rule asked to suppress the mailbox's default auto-reply.
   *
   * The calling flow binds this and, when true, clears its auto-reply variable — mirroring the
   * legacy `skipAutoReply` routing action.
   */
  skipAutoReply?: boolean | undefined;

  /**
   * Per-rule audit trail of the evaluation.
   *
   * A deployed function emits no logs, so this is the only account of why a rule did or did not
   * fire that reaches the outside world.
   */
  executionLog?: ActionResult[] | undefined;

  /**
   * The per-rule audit trail as a JSON string.
   *
   * Architect cannot bind an array of objects, so the flow binds this single string and writes it to
   * participant data — the only observability a Genesys-hosted function has (there is no CloudWatch).
   */
  executionLogJson?: string | undefined;
}>;
