# Contributor Loop Audit

## Goal
Verify:
invite received -> warm landing -> one prompt answered in under 3 minutes -> confirmation it is sealed for the child’s future -> parent sees it in the vault.

## What I verified tonight
- The respond page loads correctly from a prompt token.
- The prompt itself is readable and clear.
- The UI lets a contributor start writing immediately.
- The flow currently fails in a fresh browser session when the invite encryption key is not already available on that device.

## Important finding
The contributor response flow currently depends on the invite key being present either:
- in the original invite URL fragment, or
- in localStorage from a prior join on that same device/browser.

In a fresh browser session, a contributor can reach the respond page from a prompt token and begin typing, but submission fails because the private invite key is unavailable.

## What I tightened now
- I blocked the plaintext fallback path that was incompatible with the submit-entry API.
- I changed the error to be explicit instead of generic.

New error message:
"This response needs to be opened from your original invite link on this device so we can unlock the private key first."

## Why this matters
This is a real contributor-loop friction point.
It does not necessarily break the loop for contributors who already joined on the same browser, but it does create failure risk for:
- fresh browser sessions
- different devices
- contributors who open a prompt email before ever properly opening the invite link on that device

## Current status
- warm landing: pass
- prompt readability: pass
- response start: pass
- response completion in fresh browser: fail due to missing invite key
- parent sees resulting item in vault: blocked in fresh-browser test because submission cannot complete

## What likely needs to happen next
One of these needs to be solved:
1. prompt emails need a safe way to restore the invite key on the responding device
2. prompt links need to route through a key-restoring step before response
3. the contributor journey needs a clearer prerequisite state before direct prompt response is allowed

## Recommendation
Treat this as an active contributor-loop blocker for truly frictionless participation.
