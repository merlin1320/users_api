import express, {Request, Response} from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { log } from "console";

const app = express();
const port = 3020;

interface User {
  id: string;
  username: string;
  preferences: Preferences;
}

interface Preferences {
  darkMode: boolean;
  communicationPreferences: CommunicationPreferences;
  favoriteColors: string[];
}

interface CommunicationPreferences {
  text: boolean;
  email: boolean;
  phone: boolean;
}

const corsOptions = {
  origin: "*", // Allow all origins (not recommended for production)
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Allow cookies and authorization headers
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, Express with TypeScript!");
});

app.options("/users", (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "*");
  res.send();
});

function loadUsersFromFile(): User[] {
  const filePath = path.join(__dirname, "users.json");
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Global users array loaded from users.json
let users: User[] = loadUsersFromFile();

app.get("/users", (req: Request, res: Response) => {
  res.json(users);
});

function saveUsersToFile() {
  const filePath = path.join(__dirname, "users.json");
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
}

app.post("/users", (req: Request, res: Response) => {
  try {
    const { username, preferences } = req.body;
    if (!username || typeof username !== "string" || username.trim() === "") {
      throw new Error("'username' is required and must be a non-empty string.");
    }
    // Check if username already exists (case-insensitive)
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error("That username is already taken.");
    }
    // Provide default preferences if not given
    const defaultPreferences: Preferences = {
      darkMode: false,
      communicationPreferences: {
        text: false,
        email: false,
        phone: false
      },
      favoriteColors: []
    };
    const mergedPreferences = {
      ...defaultPreferences,
      ...(preferences || {}),
      communicationPreferences: {
        ...defaultPreferences.communicationPreferences,
        ...((preferences && preferences.communicationPreferences) || {})
      }
    };
    // No longer require preferences validation, just ensure mergedPreferences is valid
    const newUser: User = {
      id: randomUUID(),
      username,
      preferences: mergedPreferences
    };
    users.push(newUser);
    saveUsersToFile();
    res.status(201).json({
      message: "User created successfully.",
      user: newUser
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
      requirements: {
        username: "string (required, non-empty)"
      }
    });
  }
});

app.options("/users/:id/preferences", (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "*");
  res.send();
});

app.patch("/users/:id/preferences", (req: Request, res: Response) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  const { preferences } = req.body;
  if (!preferences || typeof preferences !== "object") {
    res.status(400).json({
      error: "'preferences' is required and must be an object with any of the following fields: darkMode (boolean), communicationPreferences (object), favoriteColors (array of strings)."
    });
    return;
  }
  if (preferences.darkMode !== undefined) {
    if (typeof preferences.darkMode !== "boolean") {
      res.status(400).json({ error: "'darkMode' must be a boolean." });
      return;
    }
    user.preferences.darkMode = preferences.darkMode;
  }
  if (preferences.favoriteColors !== undefined) {
    if (!Array.isArray(preferences.favoriteColors) || !preferences.favoriteColors.every((c: any) => typeof c === "string")) {
      res.status(400).json({ error: "'favoriteColors' must be an array of strings." });
      return;
    }
    user.preferences.favoriteColors = preferences.favoriteColors;
  }
  if (preferences.communicationPreferences !== undefined) {
    const cp = preferences.communicationPreferences;
    if (typeof cp !== "object" || cp === null) {
      res.status(400).json({ error: "'communicationPreferences' must be an object." });
      return;
    }
    (["text", "email", "phone"] as (keyof CommunicationPreferences)[]).forEach((key) => {
      if (cp[key] !== undefined) {
        if (typeof cp[key] !== "boolean") {
          res.status(400).json({ error: `'${key}' in communicationPreferences must be a boolean.` });
          return;
        }
        user.preferences.communicationPreferences[key] = cp[key];
      }
    });
  }
  saveUsersToFile();
  res.json({ message: "Preferences updated successfully.", user });
});
app.options("/users/:id", (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "*");
  res.send();
});

app.delete("/users/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  console.log("Attempting to delete user with id:", id);
  console.log("Current user ids:", users.map(u => u.id));
  // Filter out the user to delete
  const updatedUsers = users.filter(u => u.id !== id);
  if (updatedUsers.length === users.length) {
    console.log("User not found. Cannot delete.");
    res.status(404).json({ error: "User not found." });
    return 
  }
  users = updatedUsers;
  saveUsersToFile();
  console.log("User deleted successfully.");
  res.json({ message: "User deleted successfully." });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
