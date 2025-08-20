export default function handler(req, res) {
  // Allow only your frontend origin to access the API
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Your actual API logic
  if (req.method === "POST") {
    // Upload logic here
    return res.status(200).json({ message: "Upload successful" });
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
