import { internalAction } from "./_generated/server";

// Legacy compatibility shim.
// The production monthly prompt architecture now lives in `ourfablePrompts`.
export const sendMonthlyPrompts = internalAction({
  args: {},
  handler: async () => {
    console.warn(
      "[ourfableMonthly] Deprecated sender invoked; monthly prompts are handled by ourfablePrompts.processDueMonthlyPrompts."
    );
  },
});
