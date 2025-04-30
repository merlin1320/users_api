import express, {Request, Response} from "express";
import cors from "cors";
import { randomUUID } from "crypto";

const app = express();
const port = 3020;

interface User {
  id: string;
  username: string;
  preferences: Preferences;
}

interface Preferences {
  lightdark: boolean;
  text: boolean;
  email: boolean;
  phone: boolean;
  favoriteColors: string[]; 
}

const users: User[] = [
  {
    id: randomUUID(),
    username: "alice",
    preferences: {
      lightdark: true,
      text: false,
      email: true,
      phone: false,
      favoriteColors: ["blue", "green"]
    }
  },
  {
    id: randomUUID(),
    username: "bob",
    preferences: {
      lightdark: false,
      text: true,
      email: false,
      phone: true,
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

app.post("/users", (req: Request, res: Response) => {
  try {
    const { username, preferences } = req.body;
    if (!username || typeof username !== "string" || username.trim() === "") {
      throw new Error("'username' is required and must be a non-empty string.");
    }
    if (!preferences || typeof preferences !== "object") {
      throw new Error("'preferences' is required and must be an object with the following fields: lightdark (boolean), text (boolean), email (boolean), phone (boolean), favoriteColors (array of strings).");
    }
    const { lightdark, text, email, phone, favoriteColors } = preferences;
    if (
      typeof lightdark !== "boolean" ||
      typeof text !== "boolean" ||
      typeof email !== "boolean" ||
      typeof phone !== "boolean" ||
      !Array.isArray(favoriteColors) ||
      !favoriteColors.every((c: any) => typeof c === "string")
    ) {
      throw new Error("'preferences' must include: lightdark (boolean), text (boolean), email (boolean), phone (boolean), favoriteColors (array of strings).");
    }
    const newUser: User = {
      id: randomUUID(),
      username,
      preferences
    };
    users.push(newUser);
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
          text: "boolean (required)",
          email: "boolean (required)",
          phone: "boolean (required)",
          favoriteColors: "string[] (required)"
        }
      }
    });
  }
});

app.patch("/users/:id/preferences", (req: Request, res: Response) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return 
  }
  const { preferences } = req.body;
  if (!preferences || typeof preferences !== "object") {
    res.status(400).json({
      error: "'preferences' is required and must be an object with any of the following fields: lightdark (boolean), text (boolean), email (boolean), phone (boolean), favoriteColors (array of strings)."
    });
    return 
  }
  const allowedFields = ["lightdark", "text", "email", "phone", "favoriteColors"];
  for (const key of Object.keys(preferences)) {
    if (!allowedFields.includes(key)) continue;
    if (key === "favoriteColors") {
      if (!Array.isArray(preferences[key]) || !preferences[key].every((c: any) => typeof c === "string")) {
        res.status(400).json({ error: "'favoriteColors' must be an array of strings." });
        return 
      }
    }
    // @ts-ignore
    user.preferences[key] = preferences[key];
  }
  res.json({ message: "Preferences updated successfully.", user });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
