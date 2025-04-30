import express, { Request, Response } from "express";
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
