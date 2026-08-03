import type platformClient from "purecloud-platform-client-v2";
import type { ActionResult } from "./ActionResult.ts";
import type { RoutingDecision } from "./RoutingDecision.ts";

/**
 * Everything a rule is evaluated against, plus everything the rules have decided so far.
 *
 * The email and the API clients are fixed for the invocation; the decision, target, skill,
 * priority, replies and audit trail accumulate as rules run. Handlers return a new context rather
 * than mutating this one.
 */
export type RoutingContext = {
  /** Conversations API client, used to read the email and to send agentless mail. */
  readonly conversationApi: platformClient.ConversationsApi;

  /** Response Management API client, used to resolve canned replies by name. */
  readonly responseManagementApi: platformClient.ResponseManagementApi;

  /** Architect API client, used to read the rule datatable. */
  readonly architectApi: platformClient.ArchitectApi;

  /** The email conversation being routed. */
  readonly conversation: platformClient.Models.EmailConversation;

  /** The specific message within the conversation that rules match against. */
  readonly message: platformClient.Models.EmailMessage;

  /**
   * The terminal outcome, once a rule has produced one.
   *
   * Its presence is what stops rule evaluation, so it is absent until a rule transfers, forwards
   * or disconnects the interaction.
   */
  decision?: RoutingDecision | undefined;

  /** Queue name, flow state, or email address the decision applies to. */
  target?: string | undefined;

  /** Skill to require when routing the interaction. */
  skill?: string | undefined;

  /** Priority accumulated by the rules that have matched so far. */
  priority?: number | undefined;

  /** Canned response text staged by reply rules, in the order the rules ran. */
  replies: string[];

  /**
   * Whether a matched skipAutoReply rule asked to suppress the mailbox's default auto-reply.
   *
   * Set by a non-terminal skipAutoReply rule and carried to the response, where the calling flow
   * clears its auto-reply variable. Mirrors a legacy `skipAutoReply` routing action.
   */
  skipAutoReply?: boolean | undefined;

  /** Audit trail, one entry per rule considered — including the ones that did not match. */
  executionLog?: ActionResult[] | undefined;

  /** Whether outbound side effects are suppressed for this run. */
  isTestMode?: boolean | undefined;
};
