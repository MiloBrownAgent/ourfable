/**
 * Google Sheets integration via service account.
 *
 * Setup:
 * 1. Go to Google Cloud Console → Create/select a project
 * 2. Enable the Google Sheets API
 * 3. Create a Service Account (IAM & Admin → Service Accounts)
 * 4. Create a JSON key for the service account → download it
 * 5. Share the target Google Sheet with the service account email (Editor role)
 * 6. Set env vars:
 *    - GOOGLE_SERVICE_ACCOUNT_KEY = the full JSON key contents (as a string)
 *    - GOOGLE_SHEET_ID = the spreadsheet ID from the sheet URL
 *
 * The spreadsheet ID is the long string in the URL:
 *   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
 *
 * Current sheet: https://docs.google.com/spreadsheets/d/1TJpx60N0TAIq2_jwPn-JjuklmOkcGUo0TWH9xcgSgCQ/edit
 * Shared with: davesweeney2.8@gmail.com (writer)
 */

import crypto from "crypto";

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  token_uri: string;
}

/**
 * Mint a short-lived OAuth2 access token using a service account JWT.
 */
async function getServiceAccountToken(key: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: key.token_uri,
      exp: expiry,
      iat: now,
    })
  ).toString("base64url");

  const signingInput = `${header}.${payload}`;

  // Sign with RS256
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign(key.private_key).toString("base64url");

  const jwt = `${signingInput}.${signature}`;

  const res = await fetch(key.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get service account token: ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export interface WaitlistSheetRow {
  timestamp: string;
  email: string;
  childName?: string;
  childBirthday?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  foundingMember?: string;
}

/**
 * Append a waitlist signup row to the Google Sheet.
 * Silently no-ops if env vars are not configured.
 */
export async function appendWaitlistRow(row: WaitlistSheetRow): Promise<void> {
  const serviceAccountKeyStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!serviceAccountKeyStr || !sheetId) {
    // Not configured — skip silently
    return;
  }

  let key: ServiceAccountKey;
  try {
    key = JSON.parse(serviceAccountKeyStr) as ServiceAccountKey;
  } catch {
    console.error("GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON");
    return;
  }

  try {
    const token = await getServiceAccountToken(key);

    const values = [
      [
        row.timestamp,
        row.email,
        row.childName ?? "",
        row.childBirthday ?? "",
        row.source ?? "",
        row.utm_source ?? "",
        row.utm_medium ?? "",
        row.utm_campaign ?? "",
        row.utm_content ?? "",
        row.utm_term ?? "",
        row.foundingMember ?? "",
      ],
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Signups!A:K:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Google Sheets append error:", text);
    }
  } catch (err) {
    // Non-fatal — don't break the signup flow
    console.error("Google Sheets integration error:", err);
  }
}

/**
 * Initialize the sheet with headers if it's empty.
 * Call this once during setup or let it run on first append.
 */
export async function ensureSheetHeaders(): Promise<void> {
  const serviceAccountKeyStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!serviceAccountKeyStr || !sheetId) return;

  let key: ServiceAccountKey;
  try {
    key = JSON.parse(serviceAccountKeyStr) as ServiceAccountKey;
  } catch {
    return;
  }

  try {
    const token = await getServiceAccountToken(key);

    // Check if headers already exist
    const checkRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Signups!A1:K1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (checkRes.ok) {
      const data = await checkRes.json() as { values?: string[][] };
      if (data.values && data.values[0]?.[0] === "Timestamp") {
        return; // Headers already set
      }
    }

    // Set headers
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Signups!A1:K1?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [
            [
              "Timestamp",
              "Email",
              "Child Name",
              "Child Birthday",
              "Source",
              "UTM Source",
              "UTM Medium",
              "UTM Campaign",
              "UTM Content",
              "UTM Term",
              "Founding Member",
            ],
          ],
        }),
      }
    );
  } catch (err) {
    console.error("ensureSheetHeaders error:", err);
  }
}
