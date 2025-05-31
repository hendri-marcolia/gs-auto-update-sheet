# Google Sheet Data Ingestion Web App

This Google Apps Script project provides a simple web application endpoint that allows external systems to send structured data (JSON payload) to a Google Sheet. It dynamically creates a new sheet if one doesn't exist, named after the `date` provided in the payload, and appends the incoming `data` to it.

## Table of Contents

* [Features](#features)
* [Payload Structure](#payload-structure)
* [Setup Instructions](#setup-instructions)
    * [1. Open Google Apps Script Editor](#1-open-google-apps-script-editor)
    * [2. Paste the Script Code](#2-paste-the-script-code)
    * [3. Update Spreadsheet ID](#3-update-spreadsheet-id)
    * [4. Deploy as Web App](#4-deploy-as-web-app)
    * [5. Authorize the Script](#5-authorize-the-script)
* [Usage](#usage)
    * [Sending Data with cURL](#sending-data-with-curl)
* [Security Considerations](#security-considerations)
* [Logging and Debugging](#logging-and-debugging)

## Features

* **HTTP POST Endpoint**: Exposes a URL to receive data via POST requests.
* **Dynamic Sheet Creation**: Automatically creates a new sheet in the specified Google Spreadsheet if a sheet with the name derived from the `date` payload does not already exist.
* **Intelligent Data Appending**:
    * If `data` in the payload is an array of objects, it automatically extracts keys from the first object to create a header row (if it's a new sheet) and then appends corresponding values.
    * If `data` is an array of arrays, it appends them directly as rows.
    * If `data` is an array of primitives, each primitive is appended as a single-column row.
* **Robust Error Handling**: Provides clear success or error messages in JSON format back to the sender.
* **Logging**: Logs request details and processing steps to the Apps Script console for debugging.

## Payload Structure

The script expects a JSON payload with the following structure:

```json
{
  "date": "YYYY-MM-DD", // A string representing the date. This will be used to name the sheet.
                        // Example: "2025-06-01" will create/update a sheet named "2025-06-01".
  "data": [             // An array of data rows to append.
    // Option 1: Array of Objects (recommended for structured data)
    {"column1_header": "value1", "column2_header": "value2"},
    {"column1_header": "valueA", "column2_header": "valueB"}
    // Option 2: Array of Arrays (if you already have data in row format)
    // ["value1", "value2"],
    // ["valueA", "valueB"]
    // Option 3: Array of Primitives (for single-column data)
    // "value1",
    // "value2"
  ]
}
```

**Note on Sheet Naming**: The `date` string will be sanitized to remove invalid characters (`/`, `\`, `?`, `*`, `:`, `[`, `]`) and replace them with underscores (`_`). The sheet name will also be truncated to a maximum of 100 characters.

## Setup Instructions

Follow these steps to deploy your Google Apps Script as a Web App.

### 1. Open Google Apps Script Editor

1.  Go to your Google Drive (`drive.google.com`).
2.  Create a new Google Sheet or open an existing one that you want to use for this automation.
3.  From the Google Sheet, go to `Extensions` > `Apps Script`. This will open a new tab with the Apps Script editor.

### 2. Paste the Script Code

1.  In the Apps Script editor, you'll see a default `Code.gs` file.
2.  Replace its entire content with the script provided in the Canvas document titled "Receiving Data Payloads in Google Apps Script Web Apps".

### 3. Update Spreadsheet ID

1.  In the pasted script, locate the line:
    ```javascript
    const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
    ```
2.  Replace `'YOUR_SPREADSHEET_ID_HERE'` with the actual ID of your Google Sheet. You can find this ID in the URL of your spreadsheet. It's the long string of characters between `/d/` and `/edit/`.
    *Example URL:* `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit`

### 4. Deploy as Web App

1.  In the Apps Script editor, click `Deploy` > `New deployment`.
2.  For "Select type," choose `Web app`.
3.  Configure the deployment settings:
    * **Description:** Enter a meaningful description (e.g., "Data Ingestion Endpoint for Daily Reports").
    * **Execute as:** Select `Me` (your Google Account). This ensures the script runs with your permissions to access your Google Sheets.
    * **Who has access:** Choose `Anyone` or `Anyone, even anonymous`.
        * `Anyone`: Requires a Google account to access, but any Google account can access it.
        * `Anyone, even anonymous`: No Google account is required, making it accessible to any external system. **Choose this option if your external tool cannot authenticate with a Google account.**
4.  Click `Deploy`.

### 5. Authorize the Script

1.  The first time you deploy, Google will prompt you to authorize the script.
2.  Click `Review permissions`.
3.  Select your Google account.
4.  You might see a warning "Google hasn't verified this app." This is normal for scripts you write yourself. Click `Advanced` > `Go to [Your Project Name] (unsafe)`.
5.  Review the permissions the script needs (e.g., "See, edit, create, and delete all your Google Sheets spreadsheets").
6.  Click `Allow`.
7.  After successful authorization and deployment, you will be provided with a "Web app URL." **Copy this URL** as it is the endpoint your external source will use to send data.

## Usage

Once deployed, your external system can send HTTP `POST` requests to the Web App URL with a JSON payload conforming to the structure described above.

### Sending Data with cURL

Here's an example of how to send data using `curl` from your terminal:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
        "date": "2025-06-01",
        "data": [
          {"product": "Laptop", "price": 1200, "quantity": 1, "status": "In Stock"},
          {"product": "Mouse", "price": 25, "quantity": 5, "status": "Low Stock"},
          {"product": "Keyboard", "price": 75, "quantity": 2, "status": "In Stock"}
        ]
      }' \
  "YOUR_WEB_APP_URL_HERE" # Replace with the actual Web App URL you obtained
  ```

  **Example with Array of Arrays:**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
        "date": "2025-06-02_Summary",
        "data": [
          ["Total Sales", 1500],
          ["New Customers", 10],
          ["Revenue", 50000]
        ]
      }' \
  "YOUR_WEB_APP_URL_HERE" # Replace with the actual Web App URL you obtained
```
  ## Security Considerations

* **Access Control**: The "Who has access" setting during deployment is critical. If set to `Anyone` or `Anyone, even anonymous`, your Web App URL is publicly accessible.
* **Data Validation**: While the script validates the basic payload structure, consider adding more specific data validation within the `doPost` function if your data requires strict types or formats.
* **Authentication (Recommended for Production)**: For sensitive data or to prevent unauthorized access, implement an authentication mechanism:
    * **API Key**: Include a secret API key in the payload or as a custom HTTP header. Your script would then validate this key.
    * **OAuth 2.0 / Service Accounts**: For more secure enterprise-level integrations, consider using Google Cloud's OAuth 2.0 or Service Accounts, though this adds significant complexity.

## Logging and Debugging

You can monitor the execution of your script and view `console.log` messages in the Apps Script editor:

1.  Open your Apps Script project.
2.  On the left sidebar, click the `Executions` icon (looks like a clock with an arrow).
3.  This tab will show a list of all executions, including successful ones and those that encountered errors. Click on an execution to view its detailed logs.