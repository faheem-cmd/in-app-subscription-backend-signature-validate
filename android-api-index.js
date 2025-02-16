const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");

const app = express();
app.use(express.json());

// Load Google Play credentials
let GOOGLE_PLAY_CREDENTIALS;
try {
  GOOGLE_PLAY_CREDENTIALS = JSON.parse(
    fs.readFileSync("./payment_service.json", "utf8")
  );
  console.log("Credentials loaded successfully");
} catch (error) {
  console.error("Error loading credentials:", error);
  process.exit(1);
}

// Create a Google OAuth2 client
const authClient = new google.auth.GoogleAuth({
  credentials: GOOGLE_PLAY_CREDENTIALS,
  scopes: ["https://www.googleapis.com/auth/androidpublisher"],
});

// Initialize the Google Play API
const googlePlayApi = google.androidpublisher("v3");

// Endpoint to validate a subscription
app.post("/validate-subscription", async (req, res) => {
  const { packageName, subscriptionId, token } = req.body;

  if (!packageName || !subscriptionId || !token) {
    return res.status(400).json({
      error: "Missing required fields: packageName, subscriptionId, token",
    });
  }

  try {
    // Authenticate the client
    const client = await authClient.getClient();

    // Validate the subscription
    const response = await googlePlayApi.purchases.subscriptions.get({
      packageName,
      subscriptionId,
      token,
      auth: client,
    });

    const subscription = response.data;
    return res.status(200).json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error("Error validating subscription:", error);

    const apiError = error.response?.data;
    return res.status(500).json({
      error: "Failed to validate subscription",
      details: apiError || error.message,
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
