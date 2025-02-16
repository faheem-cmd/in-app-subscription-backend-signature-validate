const express = require("express");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const app = express();
const port = 8000;

app.use(express.json()); // Middleware to parse JSON request body

// 🔹 Apple In-App Purchase Config
const keyID = "YOUR_KEY_ID"; // Apple Key ID
const teamID = "YOUR_TEAM_ID"; // Apple Developer Team ID
const bundleID = "YOUR_BUNDLE_ID";
const privateKeyPath = "Example.p8"; // Private Key Path

// 🔹 Generate Offer Signature Function
function generateOfferSignature(productID, offerID, applicationUsername) {
  try {
    const nonce = "90b7a2a8-1eac-46d9-a7cd-308fa1d5313d"; // Static nonce (replace with dynamic UUID)
    const timestamp = Math.floor(Date.now() / 1000);

    // Read private key
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");

    // JWT Payload
    const payload = {
      iss: teamID, // Apple Developer Team ID
      iat: timestamp, // Issued at time
      exp: timestamp + 600, // Expiration time (10 min validity)
      aud: "appstoreconnect-v1",
      bid: bundleID, // App Bundle ID
      product_id: productID, // Subscription Product ID (from request)
      discount_id: offerID, // Promotional Offer ID (from request)
      applicationUsername: applicationUsername || "", // Default to empty string if not provided
      nonce, // Unique nonce
    };

    // JWT Header
    const header = {
      alg: "ES256",
      kid: keyID,
      typ: "JWT",
    };

    // Generate the signed JWT token
    const token = jwt.sign(payload, privateKey, {
      algorithm: "ES256",
      header: header,
    });

    // ✅ Return response in required format
    return {
      offerID: offerID,
      keyID: keyID,
      nonce: nonce,
      signature: token,
      timestamp: timestamp,
    };
  } catch (error) {
    console.error("Error generating offer signature:", error);
    return null;
  }
}

// 🔹 API Endpoint to Get Offer Signature
app.post("/generate-signature", (req, res) => {
  const { productID, offerID, applicationUsername } = req.body;

  if (!productID || !offerID) {
    return res
      .status(400)
      .json({ error: "Missing required parameters: productID and offerID" });
  }

  const offerSignature = generateOfferSignature(
    productID,
    offerID,
    applicationUsername
  );
  if (offerSignature) {
    res.json(offerSignature);
  } else {
    res.status(500).json({ error: "Failed to generate signature" });
  }
});

// 🔹 Start the Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});






// Payload
// {
//   "productID": "subscription_with_offer",
//   "offerID": "your_app_annual_offer",
//   "applicationUsername": ""
// }
