// api/models.js - Vercel Serverless Function to fetch available models from OpenRouter using server key
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Retrieve environment variable
    const apiKey = process.env.Openrouter || process.env.OPENROUTER_API_KEY;

    try {
        const headers = {
            "Content-Type": "application/json"
        };
        
        if (apiKey) {
            headers["Authorization"] = `Bearer ${apiKey}`;
        }

        const response = await fetch("https://openrouter.ai/api/v1/models", {
            method: "GET",
            headers: headers
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: `OpenRouter failed: ${errText}` });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (e) {
        return res.status(500).json({ error: `Server error: ${e.message}` });
    }
}
