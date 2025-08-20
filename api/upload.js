export default function handler(req, res) {
  if (req.method === "POST") {
    // Upload logic (read, save, etc.)
    res.status(200).json({ message: "Upload works!" });
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
