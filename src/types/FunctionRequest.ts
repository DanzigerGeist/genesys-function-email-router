/**
 * Describes the input payload received by the Genesys Cloud function.
 *
 * The Architect flow supplies these through the data action's request template. Between them they
 * identify the rule set to evaluate and the single email message to evaluate it against.
 */
export type FunctionRequest = Readonly<{
  /**
   * Identifier of the Architect datatable holding the routing rules.
   *
   * Every row is read on each invocation, so the table is the whole rule set rather than a
   * partition of it.
   */
  datatableId: string;

  /** Identifier of the Genesys Cloud email conversation being routed. */
  conversationId: string;

  /**
   * Identifier of the message within the conversation to evaluate.
   *
   * A conversation accumulates messages; rules match against this one, not the whole thread. Optional
   * for callers that cannot supply it (Architect email flows expose no message id): when omitted, the
   * router resolves the conversation's most recent message.
   */
  messageId?: string;

  /**
   * Evaluates every rule without performing outbound side effects.
   *
   * Filters still run and decisions are still reported, but nothing leaves the function — no
   * forward is sent. Intended for validating a rule set against real traffic before arming it.
   */
  isTestMode?: boolean;
}>;
