import axios from "axios"

const localFallback = (command, assistantName, userName) => {
    const lower = (command || "").toLowerCase();
    const cleanInput = command.replace(new RegExp(assistantName, "gi"), "").trim();

    if (lower.includes("time")) {
        return JSON.stringify({
            type: "get-time",
            userInput: cleanInput,
            response: "Checking the current time"
        });
    }
    if (lower.includes("date")) {
        return JSON.stringify({
            type: "get-date",
            userInput: cleanInput,
            response: "Checking today's date"
        });
    }
    if (lower.includes("day")) {
        return JSON.stringify({
            type: "get-day",
            userInput: cleanInput,
            response: "Checking what day it is"
        });
    }
    if (lower.includes("month")) {
        return JSON.stringify({
            type: "get-month",
            userInput: cleanInput,
            response: "Checking the current month"
        });
    }
    if (lower.includes("calculator")) {
        return JSON.stringify({
            type: "calculator-open",
            userInput: cleanInput,
            response: "Opening calculator"
        });
    }
    if (lower.includes("instagram")) {
        return JSON.stringify({
            type: "instagram-open",
            userInput: cleanInput,
            response: "Opening Instagram"
        });
    }
    if (lower.includes("facebook")) {
        return JSON.stringify({
            type: "facebook-open",
            userInput: cleanInput,
            response: "Opening Facebook"
        });
    }
    if (lower.includes("weather")) {
        return JSON.stringify({
            type: "weather-show",
            userInput: cleanInput,
            response: "Opening weather forecast"
        });
    }
    if (lower.includes("youtube")) {
        const query = cleanInput.replace(/.*(play|search)\s+/i, "").replace(/on youtube|in youtube|youtube/gi, "").trim();
        return JSON.stringify({
            type: lower.includes("play") ? "youtube-play" : "youtube-search",
            userInput: query || cleanInput,
            response: `Playing ${query || "video"} on YouTube`
        });
    }
    if (lower.includes("search") || lower.includes("google")) {
        const query = cleanInput.replace(/.*(search|google)\s+(for\s+)?/i, "").replace(/on google|in google/gi, "").trim();
        return JSON.stringify({
            type: "google-search",
            userInput: query || cleanInput,
            response: `Searching Google for ${query || cleanInput}`
        });
    }
    if (lower.includes("who are you") || lower.includes("what is your name") || lower.includes("your name")) {
        return JSON.stringify({
            type: "general",
            userInput: cleanInput,
            response: `I am your virtual assistant, ${assistantName}.`
        });
    }
    if (lower.includes("who created you") || lower.includes("who made you")) {
        return JSON.stringify({
            type: "general",
            userInput: cleanInput,
            response: `I was created by ${userName}.`
        });
    }
    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
        return JSON.stringify({
            type: "general",
            userInput: cleanInput,
            response: `Hello ${userName}! How can I help you?`
        });
    }

    return JSON.stringify({
        type: "general",
        userInput: cleanInput,
        response: "The Gemini API quota for the default key is exhausted. Please set your own GEMINI_API_KEY in the backend .env file for AI answers, but you can ask me for time, date, searches, or to open apps!"
    });
};

const geminiResponse = async (command, assistantName, userName) => {
    try {
        let apiUrl = process.env.GEMINI_API_URL;
        if (process.env.GEMINI_API_KEY) {
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;
        }

        const prompt = `You are a virtual assistant named ${assistantName} created by ${userName}. 
You are not Google. You will now behave like a voice-enabled assistant.

Your task is to understand the user's natural language input and respond with a JSON object like this:

{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month"|"calculator-open" | "instagram-open" |"facebook-open" |"weather-show"
  ,
  "userInput": "<original user input>" {only remove your name from userinput if exists} and agar kisi ne google ya youtube pe kuch search karne ko bola hai to userInput me only bo search baala text jaye,

  "response": "<a short spoken response to read out loud to the user>"
}

Instructions:
- "type": determine the intent of the user.
- "userinput": original sentence the user spoke.
- "response": A short voice-friendly reply, e.g., "Sure, playing it now", "Here's what I found", "Today is Tuesday", etc.

Type meanings:
- "general": if it's a factual or informational question. aur agar koi aisa question puchta hai jiska answer tume pata hai usko bhi general ki category me rakho bas short answer dena
- "google-search": if user wants to search something on Google .
- "youtube-search": if user wants to search something on YouTube.
- "youtube-play": if user wants to directly play a video or song.
- "calculator-open": if user wants to  open a calculator .
- "instagram-open": if user wants to  open instagram .
- "facebook-open": if user wants to open facebook.
-"weather-show": if user wants to know weather
- "get-time": if user asks for current time.
- "get-date": if user asks for today's date.
- "get-day": if user asks what day it is.
- "get-month": if user asks for the current month.

Important:
- Use ${userName} agar koi puche tume kisne banaya 
- Only respond with the JSON object, nothing else.


now your userInput- ${command}
`;

        const result = await axios.post(apiUrl, {
            "contents": [{
                "parts": [{ "text": prompt }]
            }]
        }, { timeout: 8000 });

        const text = result?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
            return text;
        }
        return localFallback(command, assistantName, userName);
    } catch (error) {
        console.warn("Gemini API call failed (using local fallback):", error?.response?.data?.error?.message || error?.message);
        return localFallback(command, assistantName, userName);
    }
}

export default geminiResponse