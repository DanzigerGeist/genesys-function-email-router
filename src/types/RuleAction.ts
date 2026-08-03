/**
 * Defines the set of executable actions that can be taken when a rule matches.
 * Each action corresponds to a specific behavior in the routing or response process.
 */
export enum RuleAction {
  /**
   * Terminates the current interaction without routing it further.
   */
  Disconnect = "disconnect",

  /**
   * Forwards the e-mail to a specified mailbox or address.
   */
  Forward = "forward",

  /**
   * Sends a predefined (canned) response to the sender.
   */
  Reply = "reply",

  /**
   * Routes the interaction to a configured queue, flow, or destination.
   */
  Route = "route",

  /**
   * Assigns a priority level to the interaction for queueing purposes.
   */
  PrioritySet = "priority_set",

  /**
   * Increases the priority level of the interaction.
   */
  PriorityIncrease = "priority_increase",

  /**
   * Decreases the priority level of the interaction.
   */
  PriorityDecrease = "priority_decrease",

  /**
   * Suppresses the mailbox's default auto-reply without routing. Not terminal: evaluation continues.
   */
  SkipAutoReply = "skipAutoReply",
}
