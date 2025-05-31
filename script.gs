/**
 * @fileoverview This script demonstrates how to receive a JSON data payload
 * from an external source via a POST request when deployed as a Web App.
 * It then dynamically creates a new Google Sheet if it doesn't exist,
 * named after the 'date' in the payload, and appends the 'data' to it.
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your actual Spreadsheet ID

/**
 * Handles HTTP POST requests sent to the Web App URL.
 * The 'e' parameter contains information about the request, including the payload.
 *
 * @param {GoogleAppsScript.Events.DoPost} e The event object for a POST request.
 * @returns {GoogleAppsScript.Content.TextOutput} A TextOutput object with a success or error message.
 */
function doPost(e) {
  try {
    console.log('Received POST request:', JSON.stringify(e));

    const requestBody = e.postData.contents;
    const payload = JSON.parse(requestBody);
    console.log('Parsed Payload:', payload);

    // Validate payload structure
    if (!payload.date || !Array.isArray(payload.data)) {
      throw new Error('Invalid payload: "date" field or "data" array missing or malformed. Expected {"date": "...", "data": [...]}.');
    }

    // Sanitize the date string to be a valid Google Sheet name.
    // Google Sheet names cannot contain '/', '\', '?', '*', ':', '[', ']'
    // and have a maximum length of 100 characters.
    const dateString = String(payload.date); // Ensure it's a string
    const sheetName = dateString.replace(/[^a-zA-Z0-9-]/g, '_').substring(0, 100);

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(sheetName);
    let isNewSheet = false;

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      isNewSheet = true;
      console.log(`Created new sheet: ${sheetName}`);
    }

    // Append the data from the payload to the sheet
    if (payload.data.length > 0) {
      // Determine if data elements are objects or arrays
      const firstDataItem = payload.data[0];
      let rowsToAppend = [];

      if (typeof firstDataItem === 'object' && !Array.isArray(firstDataItem)) {
        // Data is an array of objects, so extract headers and values
        const headers = Object.keys(firstDataItem);

        // If it's a new sheet, append headers first
        if (isNewSheet) {
          sheet.appendRow(headers);
          console.log(`Appended headers to new sheet: ${sheetName}`);
        }

        // Map each object to an array of its values based on the headers
        rowsToAppend = payload.data.map(item => headers.map(header => item[header]));
      } else if (Array.isArray(firstDataItem)) {
        // Data is an array of arrays (rows), append directly
        rowsToAppend = payload.data;
      } else {
        // Data is an array of primitives, wrap each in an array for appendRow
        rowsToAppend = payload.data.map(item => [item]);
      }

      // Append all rows at once for efficiency
      if (rowsToAppend.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
        console.log(`${rowsToAppend.length} rows successfully appended to sheet ${sheetName}.`);
      }
    } else {
      console.log('No data to append in the payload.');
    }

    console.log('Data successfully processed and written to sheet.');

    // Return a success response
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: `Data received and processed for sheet: ${sheetName}.` })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error processing POST request:', error.message);

    // Return an error response
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles HTTP GET requests sent to the Web App URL.
 * This function is less common for receiving large data payloads,
 * but can be used for simple queries or status checks.
 *
 * @param {GoogleAppsScript.Events.DoGet} e The event object for a GET request.
 * @returns {GoogleAppsScript.Content.TextOutput} A TextOutput object with a message.
 */
function doGet(e) {
  // Log the entire event object for debugging
  console.log('Received GET request:', JSON.stringify(e));

  // Access URL parameters (e.parameter for single values, e.parameters for arrays)
  const queryParam = e.parameter.query || 'No query provided';

  return ContentService.createTextOutput(
    `Hello from Apps Script! You sent: ${queryParam}`
  );
}
