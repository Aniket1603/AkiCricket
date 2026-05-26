import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit, addDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;
let db: any = null;
let auth: any = null;
let isFirebaseEnabled = false;

// Check if we have standard keys configured
if (
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    isFirebaseEnabled = true;
    console.log("Firebase initialized successfully with live database support.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn(
    "Firebase environment variables missing. Falling back to local state mode."
  );
}

export { db, auth, isFirebaseEnabled };

// Local Fallback helper interfaces
export interface UserStats {
  uid: string;
  name: string;
  score: number;
  streak: number;
  badges: string[];
  wins?: number;
  losses?: number;
  totalGames?: number;
  bestStreak?: number;
  favoriteMode?: string;
  iqHistory?: number[];
  modeCounts?: { [mode: string]: number };
  dailyAttempts?: { [date: string]: number };
  dailyCompleted?: { [date: string]: boolean };
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  wins: number;
  streak: number;
  dailyWins?: number;
  highestIQ?: number;
  rank?: number;
}

export interface GameRecord {
  gameId: string;
  category: string;
  answers: string[];
  questions: string[];
  winner: "ai" | "player";
  timestamp: number;
}

export interface AnalyticsSummary {
  totalGames: number;
  avgQuestions: number;
  aiWins: number;
  playerWins: number;
  gamesStarted: number;
  gamesCompleted: number;
  modeCounts: { [mode: string]: number };
  totalSessionDuration: number;
  sessionCount: number;
}

// Fallback Operations
const isServer = typeof window === "undefined";

// Mock User storage
export const getLocalUser = (): UserStats => {
  if (isServer) return { uid: "temp", name: "Guest Coach", score: 0, streak: 0, badges: [], wins: 0, losses: 0, totalGames: 0, bestStreak: 0, favoriteMode: "None", iqHistory: [], modeCounts: {}, dailyAttempts: {}, dailyCompleted: {} };
  const stored = localStorage.getItem("akicricket_user");
  if (stored) {
    const parsed = JSON.parse(stored);
    // Ensure new fields are seeded
    return {
      wins: 0,
      losses: 0,
      totalGames: 0,
      bestStreak: 0,
      favoriteMode: "None",
      iqHistory: [],
      modeCounts: {},
      dailyAttempts: {},
      dailyCompleted: {},
      ...parsed
    };
  }
  const defaultUser = {
    uid: "local_" + Math.random().toString(36).substring(2, 11),
    name: "Guest Coach " + Math.floor(Math.random() * 900 + 100),
    score: 10, // Initial coins
    streak: 0,
    badges: [],
    wins: 0,
    losses: 0,
    totalGames: 0,
    bestStreak: 0,
    favoriteMode: "None",
    iqHistory: [],
    modeCounts: {},
    dailyAttempts: {},
    dailyCompleted: {},
  };
  localStorage.setItem("akicricket_user", JSON.stringify(defaultUser));
  return defaultUser;
};

export const updateLocalUser = (update: Partial<UserStats>): UserStats => {
  const current = getLocalUser();
  const next = { ...current, ...update };
  if (!isServer) {
    localStorage.setItem("akicricket_user", JSON.stringify(next));
    
    // Also sync to leaderboard
    syncLocalLeaderboard(next);

    // Sync to Firestore if authenticated
    if (isFirebaseEnabled && db && auth && auth.currentUser) {
      setDoc(doc(db, "users", auth.currentUser.uid), next, { merge: true })
        .catch(err => console.warn("Firestore sync failed for user profile:", err));
      
      setDoc(doc(db, "leaderboard", auth.currentUser.uid), {
        userId: auth.currentUser.uid,
        name: next.name,
        wins: next.wins || 0,
        streak: next.streak || 0,
        dailyWins: Object.values(next.dailyCompleted || {}).filter(Boolean).length,
        highestIQ: Math.max(...(next.iqHistory || [0]), 0),
      }, { merge: true })
        .catch(err => console.warn("Firestore sync failed for leaderboard entry:", err));
    }
  }
  return next;
};

// Sync user score and streak to local leaderboard list
const syncLocalLeaderboard = (user: UserStats) => {
  if (isServer) return;
  const list = getLocalLeaderboard();
  const index = list.findIndex((x) => x.userId === user.uid);
  const entry = {
    userId: user.uid,
    name: user.name,
    wins: user.wins || 0,
    streak: user.streak || 0,
    dailyWins: Object.values(user.dailyCompleted || {}).filter(Boolean).length,
    highestIQ: Math.max(...(user.iqHistory || [0]), 0),
  };
  
  if (index >= 0) {
    list[index] = { ...list[index], ...entry };
  } else {
    list.push(entry);
  }
  localStorage.setItem("akicricket_leaderboard", JSON.stringify(list));
};

// Mock Leaderboard
export const getLocalLeaderboard = (): LeaderboardEntry[] => {
  if (isServer) return [];
  const stored = localStorage.getItem("akicricket_leaderboard");
  if (stored) {
    return JSON.parse(stored);
  }
  // Seed initial board
  const seed: LeaderboardEntry[] = [
    { userId: "csk_fan", name: "Thala_Dhoni_7", wins: 45, streak: 12, dailyWins: 14, highestIQ: 96 },
    { userId: "rcb_fan", name: "KingKohli_RunMachine", wins: 38, streak: 8, dailyWins: 11, highestIQ: 92 },
    { userId: "mi_fan", name: "HitmanRohit_45", wins: 34, streak: 6, dailyWins: 9, highestIQ: 90 },
    { userId: "kkr_fan", name: "Russell_Muscle", wins: 29, streak: 5, dailyWins: 7, highestIQ: 88 },
  ];
  localStorage.setItem("akicricket_leaderboard", JSON.stringify(seed));
  return seed;
};

// Firestore live ranking fetch
export const getFirestoreLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  if (!isFirebaseEnabled || !db) return getLocalLeaderboard();
  try {
    const q = query(collection(db, "leaderboard"), orderBy("wins", "desc"), limit(20));
    const snapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = [];
    snapshot.forEach((docSnap) => {
      entries.push(docSnap.data() as LeaderboardEntry);
    });
    if (entries.length > 0) return entries;
  } catch (e) {
    console.warn("Error fetching leaderboard from Firestore:", e);
  }
  return getLocalLeaderboard();
};

// Mock Daily Challenge
export const getDailyChallengeWord = (): { player: string; date: string } => {
  const dateStr = new Date().toISOString().split("T")[0];
  const list = [
    "MS Dhoni",
    "Virat Kohli",
    "Rohit Sharma",
    "AB de Villiers",
    "Rashid Khan",
    "Jasprit Bumrah",
    "Sunil Narine",
    "Hardik Pandya",
  ];
  // Simple deterministic hash based on date string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % list.length;
  return { player: list[index], date: dateStr };
};

// Mock Analytics
export const getLocalAnalytics = (): AnalyticsSummary => {
  if (isServer) return { totalGames: 0, avgQuestions: 0, aiWins: 0, playerWins: 0, gamesStarted: 0, gamesCompleted: 0, modeCounts: {}, totalSessionDuration: 0, sessionCount: 0 };
  const stored = localStorage.getItem("akicricket_analytics");
  if (stored) {
    const parsed = JSON.parse(stored);
    return {
      gamesStarted: parsed.totalGames || 0,
      gamesCompleted: parsed.totalGames || 0,
      modeCounts: {},
      totalSessionDuration: 0,
      sessionCount: 0,
      ...parsed
    };
  }
  
  const defaultAnalytics = {
    totalGames: 42,
    avgQuestions: 11.4,
    aiWins: 32,
    playerWins: 10,
    gamesStarted: 50,
    gamesCompleted: 42,
    modeCounts: { player: 25, team: 15, stadium: 2, moment: 0, legends: 0 },
    totalSessionDuration: 3600,
    sessionCount: 12
  };
  localStorage.setItem("akicricket_analytics", JSON.stringify(defaultAnalytics));
  return defaultAnalytics;
};

// Firestore live analytics fetch
export const getFirestoreAnalytics = async (): Promise<AnalyticsSummary | null> => {
  if (!isFirebaseEnabled || !db) return null;
  try {
    const snap = await getDoc(doc(db, "analytics", "system_summary"));
    if (snap.exists()) {
      return snap.data() as AnalyticsSummary;
    }
  } catch (e) {
    console.warn("Error fetching analytics from Firestore:", e);
  }
  return null;
};

export const trackGameStarted = (category: string = "player") => {
  if (isServer) return;
  const current = getLocalAnalytics();
  const nextStarted = (current.gamesStarted || 0) + 1;
  const nextModeCounts = { ...current.modeCounts };
  nextModeCounts[category] = (nextModeCounts[category] || 0) + 1;
  
  const updated = {
    ...current,
    gamesStarted: nextStarted,
    modeCounts: nextModeCounts,
  };
  localStorage.setItem("akicricket_analytics", JSON.stringify(updated));

  // Sync to Firestore
  if (isFirebaseEnabled && db) {
    setDoc(doc(db, "analytics", "system_summary"), updated, { merge: true })
      .catch(err => console.warn("Firestore sync failed for start game analytics:", err));
  }

  // Also update player favorite mode & counts
  const user = getLocalUser();
  const userModeCounts = { ...(user.modeCounts || {}) };
  userModeCounts[category] = (userModeCounts[category] || 0) + 1;

  // Find favorite
  let fav = user.favoriteMode || "None";
  let max = 0;
  Object.keys(userModeCounts).forEach((m) => {
    if (userModeCounts[m] > max) {
      max = userModeCounts[m];
      fav = m;
    }
  });

  updateLocalUser({
    totalGames: (user.totalGames || 0) + 1,
    modeCounts: userModeCounts,
    favoriteMode: fav,
  });
};

export const updateLocalAnalytics = (aiWon: boolean, questionsCount: number, category: string = "player", durationSeconds: number = 60) => {
  if (isServer) return;
  const current = getLocalAnalytics();
  const nextTotal = current.totalGames + 1;
  const nextAiWins = current.aiWins + (aiWon ? 1 : 0);
  const nextPlayerWins = current.playerWins + (aiWon ? 0 : 1);
  const nextAvgQuestions = parseFloat(
    ((current.avgQuestions * current.totalGames + questionsCount) / nextTotal).toFixed(1)
  );
  const nextCompleted = (current.gamesCompleted || 0) + 1;
  const nextDuration = (current.totalSessionDuration || 0) + durationSeconds;
  const nextSessionCount = (current.sessionCount || 0) + 1;

  const updated = {
    ...current,
    totalGames: nextTotal,
    aiWins: nextAiWins,
    playerWins: nextPlayerWins,
    avgQuestions: nextAvgQuestions,
    gamesCompleted: nextCompleted,
    totalSessionDuration: nextDuration,
    sessionCount: nextSessionCount,
  };
  localStorage.setItem("akicricket_analytics", JSON.stringify(updated));

  // Sync to Firestore
  if (isFirebaseEnabled && db) {
    setDoc(doc(db, "analytics", "system_summary"), updated, { merge: true })
      .catch(err => console.warn("Firestore sync failed for game completion analytics:", err));
    
    // Log individual game session document
    if (auth && auth.currentUser) {
      addDoc(collection(db, "sessions"), {
        userId: auth.currentUser.uid,
        playerName: getLocalUser().name,
        category,
        questionsCount,
        winner: aiWon ? "ai" : "player",
        durationSeconds,
        timestamp: Date.now(),
      }).catch(err => console.warn("Firestore logging failed for game session document:", err));
    }
  }

  // Also update player's own session stats
  const user = getLocalUser();
  const nextWins = (user.wins || 0) + (aiWon ? 0 : 1);
  const nextLosses = (user.losses || 0) + (aiWon ? 1 : 0);
  updateLocalUser({
    wins: nextWins,
    losses: nextLosses,
  });
};

// Google Auth Sign-In Operations
export const signInWithGoogle = async (): Promise<UserStats | null> => {
  if (!isFirebaseEnabled || !auth || !db) {
    console.warn("Firebase Auth / Database is offline.");
    return null;
  }
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    const userDocRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userDocRef);
    let profile: UserStats;

    if (snap.exists()) {
      profile = snap.data() as UserStats;
    } else {
      // Create new profile for first-time Google Sign-In
      profile = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "Google Coach",
        score: 25, // registration coin reward!
        streak: 0,
        badges: [],
        wins: 0,
        losses: 0,
        totalGames: 0,
        bestStreak: 0,
        favoriteMode: "None",
        iqHistory: [],
        modeCounts: {},
        dailyAttempts: {},
        dailyCompleted: {},
      };
      await setDoc(userDocRef, profile);
    }

    localStorage.setItem("akicricket_user", JSON.stringify(profile));
    return profile;
  } catch (error) {
    console.error("Google Sign-In failed:", error);
    return null;
  }
};

export const logoutUser = async () => {
  if (!isFirebaseEnabled || !auth) return;
  try {
    await signOut(auth);
    localStorage.removeItem("akicricket_user");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
