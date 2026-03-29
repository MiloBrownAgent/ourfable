/**
 * Google Sheets integration via OAuth2 refresh token.
 *
 * Uses milobrownagent@gmail.com OAuth credentials to write to the sheet.
 * 
 * Env vars needed in Vercel:
 *   - GOOGLE_SHEET_ID = spreadsheet ID
 *   - GOOGLE_OAUTH_CLIENT_ID = OAuth client ID
 *   - GOOGLE_OAUTH_CLIENT_SECRET = OAuth client secret
 *   - GOOGLE_OAUTH_REFRESH_TOKEN = refresh token with sheets scope
 *
 * Current sheet: https://docs.google.com/spreadsheets/d/1TJpx60N0TAIq2_jwPn-JjuklmOkcGUo0TWH9xcgSgCQ/edit
 * Shared with: davesweeney2.8@gmail.com (writer)
 */

/**
 * Get an access token using OAuth2 refresh token flow.
 */
async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google OAuth env vars not configured");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to refresh token: ${text}`);
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
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId || !process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
    // Not configured — skip silently
    return;
  }

  try {
    const token = await getAccessToken();

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
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId || !process.env.GOOGLE_OAUTH_REFRESH_TOKEN) return;

  try {
    const token = await getAccessToken();

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
