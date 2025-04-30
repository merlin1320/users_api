import express, {Request, Response} from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const app = express();
const port = 3020;

interface User {
  id: string;
  username: string;
  preferences: Preferences;
}

interface Preferences {
  lightdark: boolean;
  communicationPreferences: CommunicationPreferences;
  favoriteColors: string[];
}

interface CommunicationPreferences {
  text: boolean;
  email: boolean;
  phone: boolean;
}

const users: User[] = [
  {
    id: randomUUID(),
    username: "alice",
    preferences: {
      lightdark: true,
      communicationPreferences: {
        text: false,
        email: true,
        phone: false
      },
      favoriteColors: ["blue", "green"]
    }
  },
  {
    id: randomUUID(),
    username: "bob",
    preferences: {
      lightdark: false,
      communicationPreferences: {
        text: true,
        email: false,
        phone: true
      },
      favoriteColors: ["red", "yellow"]
    }
  }
];

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
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
  res.header("Access-Control-Allow-Headers", "*");
  res.send();
});

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
    if (!preferences || typeof preferences !== "object") {
      throw new Error("'preferences' is required and must be an object with the following fields: lightdark (boolean), communicationPreferences (object), favoriteColors (array of strings). communicationPreferences must include text, email, and phone (all booleans).");
    }
    const { lightdark, communicationPreferences, favoriteColors } = preferences;
    if (
      typeof lightdark !== "boolean" ||
      !communicationPreferences || typeof communicationPreferences !== "object" ||
      typeof communicationPreferences.text !== "boolean" ||
      typeof communicationPreferences.email !== "boolean" ||
      typeof communicationPreferences.phone !== "boolean" ||
      !Array.isArray(favoriteColors) ||
      !favoriteColors.every((c: any) => typeof c === "string")
    ) {
      throw new Error("'preferences' must include: lightdark (boolean), communicationPreferences (object with text, email, phone as booleans), favoriteColors (array of strings). ");
    }
    const newUser: User = {
      id: randomUUID(),
      username,
      preferences
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
        username: "string (required, non-empty)",
        preferences: {
          lightdark: "boolean (required)",
          communicationPreferences: {
            text: "boolean (required)",
            email: "boolean (required)",
            phone: "boolean (required)"
          },
          favoriteColors: "string[] (required)"
        }
      }
    });
  }
});

app.options("/users/:id/preferences", (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
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
      error: "'preferences' is required and must be an object with any of the following fields: lightdark (boolean), communicationPreferences (object), favoriteColors (array of strings)."
    });
    return;
  }
  if (preferences.lightdark !== undefined) {
    if (typeof preferences.lightdark !== "boolean") {
      res.status(400).json({ error: "'lightdark' must be a boolean." });
      return;
    }
    user.preferences.lightdark = preferences.lightdark;
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
  res.json({ message: "Preferences updated successfully.", user });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
