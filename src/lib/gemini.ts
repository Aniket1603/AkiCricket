import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else if (typeof window === "undefined") {
  console.warn(
    "Warning: GOOGLE_API_KEY environment variable is missing. Gemini functions will run in Mock Fallback mode."
  );
}

export interface QuestionHistory {
  question: string;
  answer: "yes" | "no" | "dont_know";
}

export interface GuessResponse {
  nextQuestion: string | null;
  confidenceScore: number;
  remainingCandidates: string[];
  aiResponseText: string;
  guess: string | null;
}

// Structured JSON Schema for Gemini
const guessResponseSchema: any = {
  type: "object",
  properties: {
    nextQuestion: {
      type: "string",
      description: "The next Yes/No question to ask the user. Must be null if making a guess.",
    },
    confidenceScore: {
      type: "integer",
      description: "Confidence percentage (0 to 100) that you have narrowed down the candidate.",
    },
    remainingCandidates: {
      type: "array",
      items: { type: "string" },
      description: "List of 1 to 5 possible remaining candidates you are considering.",
    },
    aiResponseText: {
      type: "string",
      description: "Comment from AkiCricket AI in its current personality tone.",
    },
    guess: {
      type: "string",
      description: "The final guess (e.g. 'MS Dhoni', 'CSK', 'Wankhede Stadium') if confidence is high or questions reach 15. Otherwise null.",
    },
  },
  required: ["confidenceScore", "remainingCandidates", "aiResponseText"],
};

export async function askGeminiToGuess(
  category: string,
  history: QuestionHistory[],
  modelName: string = "gemini-2.0-flash"
): Promise<GuessResponse> {
  const questionCount = history.length;
  
  if (!genAI) {
    // Return mock response when API key is missing
    return getMockGuessResponse(category, history);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: guessResponseSchema,
        temperature: 0.2,
      },
    });

    const historyText = history
      .map((h, i) => `Q${i + 1}: ${h.question} -> Answer: ${h.answer}`)
      .join("\n");

    const prompt = `
You are AkiCricket AI, a smug, holographic IPL cricket analyst playing a Yes/No guessing game (like Akinator).
The category is: "${category}" (can be Player, Team, Moment, Stadium, Legend).

Rules:
1. Review the history of questions and answers so far:
---
${historyText || "No questions asked yet."}
---

2. Based on the clues:
   - Calculate your confidence score (0 to 100).
   - Formulate the next best Yes/No question to eliminate candidates, OR make a final guess if you are >= 90% sure or this is the 15th question.
   - List the 1-5 top remaining candidates you are thinking of.
   - Speak in the AkiCricket personality. Customize your 'aiResponseText' based on the following:
     * If confidence < 40%: Stressed or intrigued. "Wait... you're making this difficult.", "A worthy opponent. Let's see."
     * If confidence is between 40% and 80%: Analytical, focused. "The field placement is changing. Let's dig deeper."
     * If confidence is > 80%: Smug. "I already know who you're thinking about 😏"
     * If confidence is > 90%: Extremely confident. "This is too easy for me."
     * If this is question 12, 13, or 14 (last 3): High stakes, dramatic. "Only a few overs left...", "One mistake and I lose."

3. Provide a JSON response matching the schema. If you make a final 'guess', the 'nextQuestion' MUST be null, and 'guess' MUST be the exact name of the player/team/moment/stadium.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as GuessResponse;
  } catch (error) {
    console.error("Gemini API call failed, falling back to mock:", error);
    return getMockGuessResponse(category, history);
  }
}

// AI Battle Mode Generation
export interface BattleRound {
  question: string;
  prediction: string;
  commentaryA: string;
  commentaryB: string;
  confidenceA: number;
}

export async function simulateBattleRound(
  category: string,
  history: QuestionHistory[],
  modelName: string = "gemini-2.0-flash"
): Promise<BattleRound> {
  if (!genAI) {
    return getMockBattleRound(category, history);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            question: { type: "string" },
            prediction: { type: "string" },
            commentaryA: { type: "string" },
            commentaryB: { type: "string" },
            confidenceA: { type: "integer" },
          },
          required: ["question", "prediction", "commentaryA", "commentaryB", "confidenceA"],
        } as any,
      },
    });

    const historyText = history
      .map((h, i) => `Q${i + 1}: ${h.question} -> Answer: ${h.answer}`)
      .join("\n");

    const prompt = `
You are simulating a battle between two IPL Cricket AI agents:
Agent A (The Guesser) is trying to guess what the user is thinking of in the category: "${category}".
Agent B (The Predictor) is trying to predict what question Agent A will ask next.

History of previous rounds:
---
${historyText || "No rounds played yet."}
---

Generate the next step of the battle as a JSON response with:
1. "question": The next Yes/No question Agent A decides to ask.
2. "prediction": Agent B's guess of what Agent A's question would be. Make them slightly different or identical to show Agent B's accuracy.
3. "commentaryA": Agent A speaking to the audience (e.g. "I'm going to bowl a bouncer to narrow this down...").
4. "commentaryB": Agent B commenting on Agent A's strategy (e.g. "He's going for a spin question. I saw that coming!").
5. "confidenceA": Agent A's confidence score (0-100).
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as BattleRound;
  } catch (error) {
    console.error("Gemini API Battle call failed, falling back to mock:", error);
    return getMockBattleRound(category, history);
  }
}

// Timeline Explorer Generation
export interface TimelineItem {
  year: string;
  event: string;
  details: string;
}

export interface TimelineData {
  title: string;
  subtitle: string;
  items: TimelineItem[];
  funFact: string;
}

export async function generateTimeline(
  target: string,
  category: string,
  modelName: string = "gemini-2.0-flash"
): Promise<TimelineData> {
  if (!genAI) {
    return getMockTimeline(target, category);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  year: { type: "string" },
                  event: { type: "string" },
                  details: { type: "string" },
                },
                required: ["year", "event", "details"],
              },
            },
            funFact: { type: "string" },
          },
          required: ["title", "subtitle", "items", "funFact"],
        } as any,
      },
    });

    const prompt = `
Create an engaging IPL career timeline and summary for the target: "${target}" in the category: "${category}".
Return a JSON object containing:
1. "title": Header title (e.g. "The Legend of MS Dhoni")
2. "subtitle": A catchy tagline (e.g. "Captain Cool's IPL Journey")
3. "items": An array of 3 to 5 key historical milestones with "year", "event" (short name), and "details" (1-2 sentences).
4. "funFact": An interesting, lesser-known IPL trivia or statistic about them.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as TimelineData;
  } catch (error) {
    return getMockTimeline(target, category);
  }
}


// ==========================================
// MOCK FALLBACK ENGINES FOR OFFLINE / NO-KEY DEMO
// ==========================================

function getMockGuessResponse(category: string, history: QuestionHistory[]): GuessResponse {
  const qCount = history.length;
  
  // Hardcoded target candidates the mock will follow based on answers
  // For demo, let's guide the mock to guess "MS Dhoni", "CSK", "2016 RCB run" or "Wankhede Stadium"
  if (category === "player" || category === "legends") {
    // Let's guess MS Dhoni, Virat Kohli, or Rohit Sharma
    const isIndian = history.find(h => h.question.includes("Indian") && h.answer === "yes");
    const wonTitle = history.find(h => h.question.includes("IPL title") && h.answer === "yes");
    const csk = history.find(h => h.question.includes("CSK") && h.answer === "yes");
    const rcb = history.find(h => h.question.includes("RCB") && h.answer === "yes");

    if (qCount === 0) {
      return {
        nextQuestion: "Is this player Indian?",
        confidenceScore: 20,
        remainingCandidates: ["MS Dhoni", "Virat Kohli", "AB de Villiers", "Rashid Khan"],
        aiResponseText: "Let's kick off! Is your player Indian?",
        guess: null
      };
    }
    if (qCount === 1) {
      return {
        nextQuestion: "Has this player won an IPL title?",
        confidenceScore: 35,
        remainingCandidates: isIndian ? ["MS Dhoni", "Virat Kohli", "Rohit Sharma"] : ["AB de Villiers", "Rashid Khan", "Sunil Narine"],
        aiResponseText: "Interesting. Did they win an IPL title?",
        guess: null
      };
    }
    if (qCount === 2) {
      return {
        nextQuestion: "Is this player associated with CSK?",
        confidenceScore: 60,
        remainingCandidates: ["MS Dhoni", "Rohit Sharma", "Virat Kohli"],
        aiResponseText: "Understood. Are they associated with Chennai Super Kings?",
        guess: null
      };
    }
    if (qCount === 3) {
      if (csk?.answer === "yes") {
        return {
          nextQuestion: null,
          confidenceScore: 98,
          remainingCandidates: ["MS Dhoni"],
          aiResponseText: "I already know who you're thinking about 😏. This is too easy for me.",
          guess: "MS Dhoni"
        };
      } else if (rcb?.answer === "yes" || !wonTitle) {
        return {
          nextQuestion: null,
          confidenceScore: 95,
          remainingCandidates: ["Virat Kohli"],
          aiResponseText: "Ah, the King! You're thinking of Virat Kohli.",
          guess: "Virat Kohli"
        };
      } else {
        return {
          nextQuestion: null,
          confidenceScore: 95,
          remainingCandidates: ["Rohit Sharma"],
          aiResponseText: "I've hit a six with this one. It's Rohit Sharma!",
          guess: "Rohit Sharma"
        };
      }
    }
  }

  if (category === "team") {
    const yellow = history.find(h => h.question.includes("yellow") && h.answer === "yes");
    const red = history.find(h => h.question.includes("red") && h.answer === "yes");

    if (qCount === 0) {
      return {
        nextQuestion: "Does this team wear yellow jersey?",
        confidenceScore: 25,
        remainingCandidates: ["CSK", "RCB", "MI", "KKR"],
        aiResponseText: "A team! Does this team wear yellow?",
        guess: null
      };
    }
    if (qCount === 1) {
      if (yellow?.answer === "yes") {
        return {
          nextQuestion: null,
          confidenceScore: 99,
          remainingCandidates: ["CSK"],
          aiResponseText: "Whistle Podu! It's Chennai Super Kings (CSK)!",
          guess: "CSK"
        };
      }
      return {
        nextQuestion: "Has this team won the IPL trophy?",
        confidenceScore: 50,
        remainingCandidates: ["MI", "RCB", "KKR"],
        aiResponseText: "Not yellow. Has this team won the IPL trophy?",
        guess: null
      };
    }
    if (qCount === 2) {
      const won = history.find(h => h.question.includes("trophy") && h.answer === "yes");
      if (won?.answer === "yes") {
        return {
          nextQuestion: null,
          confidenceScore: 95,
          remainingCandidates: ["MI"],
          aiResponseText: "I already know who you're thinking about 😏. Mumbai Indians!",
          guess: "MI"
        };
      } else {
        return {
          nextQuestion: null,
          confidenceScore: 95,
          remainingCandidates: ["RCB"],
          aiResponseText: "Ee Sala Cup Namde! It's Royal Challengers Bengaluru (RCB)!",
          guess: "RCB"
        };
      }
    }
  }

  // Fallback default mock for other categories (Moment, Stadium, default)
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  if (qCount >= 4) {
    let finalGuess = "Wankhede Stadium";
    if (category === "moment") finalGuess = "2016 RCB Run";
    if (category === "legends") finalGuess = "Sachin Tendulkar";
    
    return {
      nextQuestion: null,
      confidenceScore: 95,
      remainingCandidates: [finalGuess],
      aiResponseText: "My IPL memory banks are flashing! I got it.",
      guess: finalGuess
    };
  }

  return {
    nextQuestion: `Is this related to the state of Maharashtra or South India?`,
    confidenceScore: 10 + qCount * 20,
    remainingCandidates: [categoryLabel + " Candidate A", categoryLabel + " Candidate B"],
    aiResponseText: `Analyzing data points... Level ${qCount + 1}.`,
    guess: null
  };
}

function getMockBattleRound(category: string, history: QuestionHistory[]): BattleRound {
  const qCount = history.length;
  const questions = [
    "Is this related to a batsman?",
    "Has this target won more than 3 IPL titles?",
    "Is this person associated with Royal Challengers Bengaluru?",
    "Did this event happen in a final match?",
  ];
  const q = questions[qCount % questions.length];
  
  const commentsA = [
    "Bowl a spinner. I want to check if they play spin well.",
    "Let's check their trophy cabinet, that will clear the field.",
    "Targeting RCB. They have a massive fanbase, let's see if this is Bengaluru-related.",
    "Taking a risk, checking if it was a high-stakes final moment!",
  ];

  const commentsB = [
    "He's definitely going to ask about batsmen first. Standard opening bowler strategy.",
    "Predicting a title question. A classic containment strategy.",
    "He will test the RCB fandom. My algorithms predicted this exact question!",
    "He's going for a boundary check. I had this flagged in my preview session.",
  ];

  return {
    question: q,
    prediction: qCount % 2 === 0 ? q : q + " (or similar)",
    commentaryA: commentsA[qCount % commentsA.length],
    commentaryB: commentsB[qCount % commentsB.length],
    confidenceA: Math.min(15 + qCount * 22, 95),
  };
}

function getMockTimeline(target: string, category: string): TimelineData {
  return {
    title: `The Legend of ${target}`,
    subtitle: `Iconic IPL journey of the ${category}`,
    items: [
      {
        year: "2008",
        event: "Inception & Draft",
        details: "Debuted in the inaugural season of IPL, cementing their spot instantly."
      },
      {
        year: "2013",
        event: "First IPL Title",
        details: "Led the charge in a stellar season, lifting the coveted trophy for the first time."
      },
      {
        year: "2019",
        event: "Dramatic Final Win",
        details: "Eked out a historic 1-run victory in one of the most thriller finals in IPL history."
      },
      {
        year: "2023",
        event: "Thala-Mania Champion",
        details: "Capped off a sensational campaign with a final-ball victory, securing the 5th title."
      }
    ],
    funFact: `${target} has played the most final matches in IPL history and holds a remarkable win percentage in run chases!`
  };
}

export interface ExplanationResponse {
  importantQuestions: string[];
  eliminationStrategy: string;
  whySelected: string;
  finalConfidence: number;
}

const explanationSchema: any = {
  type: "object",
  properties: {
    importantQuestions: {
      type: "array",
      items: { type: "string" },
      description: "List of the 2-3 most critical questions that helped narrow down the target.",
    },
    eliminationStrategy: {
      type: "string",
      description: "A summary explaining how candidates were eliminated step-by-step.",
    },
    whySelected: {
      type: "string",
      description: "The primary logic why this specific guess was selected as the final target.",
    },
    finalConfidence: {
      type: "integer",
      description: "The confidence level (0 to 100) of the final guess.",
    },
  },
  required: ["importantQuestions", "eliminationStrategy", "whySelected", "finalConfidence"],
};

export async function explainGuess(
  target: string,
  category: string,
  history: QuestionHistory[],
  modelName: string = "gemini-2.0-flash"
): Promise<ExplanationResponse> {
  if (!genAI) {
    return getMockExplanation(target, category, history);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: explanationSchema,
        temperature: 0.2,
      },
    });

    const historyText = history
      .map((h, i) => `Q${i + 1}: ${h.question} -> Answer: ${h.answer}`)
      .join("\n");

    const prompt = `
You are AkiCricket AI, the smart IPL cricket analyst. You just completed a guessing game.
The target was: "${target}" in the category: "${category}".

Here is the log of questions asked and the user's answers:
---
${historyText || "No questions asked."}
---

Provide a JSON explanation card detailing:
1. "importantQuestions": The 2-3 most important questions that directed your guessing path.
2. "eliminationStrategy": A clear, professional summary of how you eliminated incorrect candidates.
3. "whySelected": Why the target "${target}" was selected as the final correct match.
4. "finalConfidence": The percentage confidence of this guess.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as ExplanationResponse;
  } catch (error) {
    console.error("Gemini Explanation API failed, returning mock:", error);
    return getMockExplanation(target, category, history);
  }
}

function getMockExplanation(target: string, category: string, history: QuestionHistory[]): ExplanationResponse {
  return {
    importantQuestions: [
      history[0]?.question || "Is the player Indian?",
      history[2]?.question || "Is this player associated with CSK?",
    ],
    eliminationStrategy: `Filtered down the candidate list using binary state parameters (nationality, franchise associations, and career trophies). By removing players not matching "${category}" benchmarks, we narrowed the field from 50+ candidates down to a single high-probability match.`,
    whySelected: `The unique combination of clues (especially the answers to key franchise queries) matches the career profile of ${target} perfectly, making them the only logically consistent candidate.`,
    finalConfidence: 98,
  };
}
