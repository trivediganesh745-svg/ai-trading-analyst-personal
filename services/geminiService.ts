import { GoogleGenAI, Type } from "@google/genai";
import type { Tick, NewsHeadline, AISignal, Trade, OHLCV } from '../types';
import { SignalAction } from '../types';
import { config } from '../config'; // Import config

// CRITICAL FIX: Check for API_KEY from the config file.
if (!config.API_KEY || config.API_KEY.includes('PASTE_YOUR_GEMINI_API_KEY_HERE')) {
    throw new Error("Missing Gemini API Key. Please edit config.ts");
}

// Initialize the GoogleGenAI client with the key from config.
const ai = new GoogleGenAI({ apiKey: config.API_KEY });
const model = 'gemini-2.5-flash';

const signalSchema = {
    type: Type.OBJECT,
    properties: {
        signal: {
            type: Type.STRING,
            enum: [SignalAction.BUY, SignalAction.SELL, SignalAction.HOLD],
            description: "The trading signal: BUY, SELL, or HOLD.",
        },
        confidence: {
            type: Type.NUMBER,
            description: "Confidence level of the signal, from 0.0 to 1.0.",
        },
        target: {
            type: Type.NUMBER,
            description: "Suggested target price for the trade.",
        },
        stoploss: {
            type: Type.NUMBER,
            description: "Suggested stop-loss price for the trade.",
        },
        reason: {
            type: Type.STRING,
            description: "A brief, 1-2 sentence reason for the signal based on the provided data.",
        }
    },
    required: ["signal", "confidence", "target", "stoploss", "reason"]
};

const formatTicks = (ticks: Tick[]): string => {
    if (ticks.length === 0) return 'No tick data available.';
    const latestTicks = ticks.slice(-10); // Last 10 ticks
    return latestTicks.map(t => `Price: ${t.price.toFixed(2)} at ${new Date(t.timestamp).toLocaleTimeString()}`).join('\n');
};

const formatHeadlines = (headlines: NewsHeadline[]): string => {
    if (headlines.length === 0) return 'No news headlines available.';
    const latestHeadlines = headlines.slice(-5); // Last 5 headlines
    return latestHeadlines.map(h => `[${h.sentiment}] ${h.text}`).join('\n');
};

const formatOhlcv = (ohlcv: OHLCV): string => {
    return `Open: ${ohlcv.open}, High: ${ohlcv.high}, Low: ${ohlcv.low}, Close: ${ohlcv.close}, Volume: ${ohlcv.volume}`;
};


export const getGeminiAnalysis = async (
    instrument: string,
    ticks: Tick[],
    headlines: NewsHeadline[],
    ohlcv: OHLCV
): Promise<AISignal> => {

    const cleanInstrument = instrument.replace(/NSE:|BSE:|-EQ|-INDEX/gi, '');
    const latestPrice = ticks.length > 0 ? ticks[ticks.length - 1].price : ohlcv.close;

    const systemInstruction = `You are an expert financial analyst AI providing real-time trading signals for the Indian stock market.
Analyze the provided market data for ${cleanInstrument} and generate a trading signal (BUY, SELL, or HOLD).
Your analysis must be based *only* on the data provided: recent price ticks, market sentiment from news headlines, and the day's OHLCV data.
Be decisive but cautious. If the data is ambiguous, it is better to signal HOLD.
Calculate a realistic target and stoploss based on the current price of ${latestPrice.toFixed(2)}. For a BUY signal, target should be higher and stoploss lower. For a SELL signal, target should be lower and stoploss higher. The stoploss should be closer to the current price than the target to manage risk.`;

    const prompt = `
Instrument: ${cleanInstrument}
Current Price: ${latestPrice.toFixed(2)}

**Recent Price Ticks (latest first):**
${formatTicks(ticks)}

**Recent News Headlines:**
${formatHeadlines(headlines)}

**Day's OHLCV Data:**
${formatOhlcv(ohlcv)}

Based on this data, provide a trading signal in JSON format.
`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: signalSchema,
                temperature: 0.3, 
            },
        });
        
        const jsonText = response.text.trim();
        const signal = JSON.parse(jsonText) as AISignal;

        if (!signal.signal || !signal.reason) {
            throw new Error("Invalid signal format received from AI");
        }

        return signal;

    } catch (error) {
        console.error("Error getting Gemini analysis:", error);
        return {
            signal: SignalAction.HOLD,
            confidence: 0.5,
            target: latestPrice,
            stoploss: latestPrice,
            reason: "Could not retrieve AI analysis due to an error. Holding position.",
        };
    }
};

export const getSignalExplanation = async (trade: Trade): Promise<string> => {
    const { signal, tick, contextTicks, contextHeadlines } = trade;
    const cleanInstrument = "the instrument"; 

    const systemInstruction = `You are a financial analyst AI named Aura. You are explaining a trading decision you made previously.
Analyze the provided historical market data that was available at the moment of the trade.
Provide a concise, 2-3 sentence explanation for why you issued the original signal.
Focus on the interplay between price action (ticks) and news sentiment that led to the decision.
Do not give financial advice or comment on the trade's outcome. Just explain the original rationale.`;

    const prompt = `
**Trade to Explain:**
I issued a **${signal.signal}** signal for ${cleanInstrument} at a price of **${tick.price.toFixed(2)}**.
My original reasoning was: "${signal.reason}".

**Market Context at Time of Trade:**

*Price Ticks Leading up to the Trade:*
${formatTicks(contextTicks)}

*News Headlines at the Time:*
${formatHeadlines(contextHeadlines)}

**Task:**
Based on the market context provided, please re-state and elaborate on the rationale for the ${signal.signal} signal in 2-3 sentences.
`;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.5,
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error getting Gemini explanation:", error);
        return "Sorry, I was unable to retrieve an explanation for this trade due to a server error.";
    }
};
