import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3019;

app.use(cors({
    origin: "*",
    credentials: true
}));
app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const generationConfig = {
    stopSequences: ["\n\n"], 
    maxOutputTokens: 200,
    temperature: 1,
    topP: 0.9,
    topK: 40,
};

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, generationConfig);

let history = [];

function removeMarkdown(text) {
    return text.replace(/[_*~`<>#\[\]]+/g, '');
}

function formatText(text) {
    return text.replace(/(\.\s*\d+)/g, '.\n$1');
}

async function run(prompt = "") {
    try {
        const historyContext = history.join('\n') + '\n' + prompt;
        const result = await model.generateContent(historyContext);
        const text = result.response.text();
        const plainText = removeMarkdown(text);
        const formattedText = formatText(plainText);
        history.push(prompt);
        history.push(formattedText);

        if (history.length > 20) {
            history = history.slice(-20);
        }

        return formattedText;
    } catch (error) {
        console.error('Error generating content:', error);
        throw error;
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'index.html'));
});

app.post("/api", async (req, res) => {
    const { text } = req.body;
    try {
        const data = await run(text);
        res.json({ generatedText: data });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Failed to generate content' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
