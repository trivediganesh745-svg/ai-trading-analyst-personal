import { useState, useEffect, useRef, useCallback } from 'react';
import type { NewsHeadline, Sentiment } from '../types';

const SIMPLIFIED_HEADLINES: Record<Sentiment, string[]> = {
    Positive: [
      "Strong Earnings Report",
      "Analyst Upgrade: 'Strong Buy'",
      "Major Partnership Announcement",
      "Positive Economic Data",
      "High Institutional Buying Volume",
    ],
    Negative: [
      "Regulatory Concerns",
      "Key Executive Departure",
      "Earnings Miss",
      "Broad Market Sell-Off",
      "Increased Competition",
    ],
    Neutral: [
      "Awaiting Inflation Data",
      "Low Volume / Indecision",
      "Divided Analyst Outlook",
      "Market Holding Pattern",
      "Price Consolidation Phase",
    ],
};

const getRandomHeadline = (instrument: string): NewsHeadline => {
    const sentimentKeys = Object.keys(SIMPLIFIED_HEADLINES) as Sentiment[];
    const randomSentiment = sentimentKeys[Math.floor(Math.random() * sentimentKeys.length)];
    
    const headlines = SIMPLIFIED_HEADLINES[randomSentiment];
    const randomHeadlineText = headlines[Math.floor(Math.random() * headlines.length)];
    
    const cleanInstrument = instrument.replace(/NSE:|BSE:|-EQ|-INDEX/gi, '');
    
    return {
        timestamp: Date.now(),
        sentiment: randomSentiment,
        text: randomHeadlineText.replace('{INSTRUMENT}', cleanInstrument),
    };
}

export const useNewsFeed = (instrument: string, interval: number | undefined = 8000, maxHeadlines = 20) => {
  const [headlines, setHeadlines] = useState<NewsHeadline[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateHeadline = useCallback(() => {
    setHeadlines(prev => [getRandomHeadline(instrument), ...prev].slice(0, maxHeadlines));
  }, [instrument, maxHeadlines]);

  useEffect(() => {
    setHeadlines([getRandomHeadline(instrument)]);
    
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
    }
    
    if (interval && interval > 0) {
        intervalRef.current = setInterval(() => {
            generateHeadline();
        }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, generateHeadline, instrument]);

  return { headlines };
};
