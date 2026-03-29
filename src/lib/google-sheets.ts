/**
 * Google Sheets integration via Drive API (CSV upload).
 *
 * Uses Drive API to update a Google Sheet with waitlist data.
 * Drive API is enabled on the project; Sheets API is not.
 *
 * Env vars:
 *   - GOOGLE_SHEET_ID = spreadsheet file ID
 *   - GOOGLE_OAUTH_CLIENT_ID = OAuth client ID
 *   - GOOGLE_OAUTH_CLIENT_SECRET = OAuth client secret
 *   - GOOGLE_OAUTH_REFRESH_TOKEN = refresh token with drive scope
 *
 * Sheet: https://docs.google.com/spreadsheets/d/1_dahUkpFnJkKDYKbUAePN3jRJbAx4_SEKNavH72Zkss/edit
 * Shared with: davesweeney2.8@gmail.com (writer)
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

function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
}

function rowToCSV(row: WaitlistSheetRow): string {
  return [
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
  ].map(escapeCSV).join(",");
}

const HEADERS = "Timestamp,Email,Child Name,Child Birthday,Source,UTM Source,UTM Medium,UTM Campaign,UTM Content,UTM Term,Founding Member";

/**
 * Append a waitlist signup row to the Google Sheet.
 * Uses Drive API: downloads existing CSV, appends row, re-uploads.
 * Silently no-ops if env vars are not configured.
 */
export async function appendWaitlistRow(row: WaitlistSheetRow): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId || !process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
    return;
  }

  try {
    const token = await getAccessToken();

    // Download existing content as CSV
    const exportRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${sheetId}/export?mimeType=text/csv`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let existingCSV = "";
    if (exportRes.ok) {
      existingCSV = await exportRes.text();
    }

    // If empty or no headers, start fresh
    if (!existingCSV || !existingCSV.includes("Timestamp")) {
      existingCSV = HEADERS;
    }

    // Append new row
    const newCSV = existingCSV.trimEnd() + "\n" + rowToCSV(row);

    // Upload updated CSV back to the sheet
    const updateRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${sheetId}?uploadType=media`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "text/csv",
        },
        body: newCSV,
      }
    );

    if (!updateRes.ok) {
      const text = await updateRes.text();
      console.error("Google Sheets update error:", text);
    }
  } catch (err) {
    console.error("Google Sheets integration error:", err);
  }
}

/**
 * No-op for backwards compatibility. Headers are included in CSV automatically.
 */
export async function ensureSheetHeaders(): Promise<void> {
  // Headers are part of the CSV — no separate setup needed
}
