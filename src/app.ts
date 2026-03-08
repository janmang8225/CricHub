import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import playerRoutes from "./modules/players/player.routes.js";
import teamRoutes from "./modules/teams/team.routes.js";
import matchRoutes from "./modules/matches/match.routes.js";
import scoreRoutes from "./modules/scores/score.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import userRoutes from "./modules/users/user.routes.js";
import { logger } from "./middlewares/logger.middleware.js";
import { setupSwagger } from "./config/swagger.js";
import cors from "cors"



const app = express();
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
// app.use(cors({
//   origin: true
// })); // this is temporary (just for api-explorer)
// handle preflight explicitly
// app.options("*", cors());

app.use(logger);

app.get("/", (_, res) => {
  res.json({ status: "ok" });
});

app.use("/", userRoutes);
app.use("/", scoreRoutes);
app.use("/auth", authRoutes);
app.use("/players", playerRoutes);
app.use("/teams", teamRoutes);
app.use("/matches", matchRoutes);

// Setup Swagger documentation
setupSwagger(app);

app.use(errorMiddleware);


export default app;
