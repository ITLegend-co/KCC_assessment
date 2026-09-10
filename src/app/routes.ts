import { createHashRouter } from "react-router-dom";
import Root from "./pages/Root";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import StudentRegistration from "./pages/StudentRegistration";
import JudgeScoring from "./pages/JudgeScoring";
import Ranking from "./pages/Ranking";
import RankingOnly from "./pages/RankingOnly";
import QrGenerator from "./pages/QrGenerator";
import AppError from "./pages/AppError";

export const router = createHashRouter([
  {
    path: "/login",
    Component: Login,
    ErrorBoundary: AppError,
  },
  {
    path: "/ranking-only",
    Component: RankingOnly,
    ErrorBoundary: AppError,
  },
  {
    path: "/",
    Component: Root,
    ErrorBoundary: AppError,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: "settings",
        Component: Settings,
      },
      {
        path: "registration",
        Component: StudentRegistration,
      },
      {
        path: "judge",
        Component: JudgeScoring,
      },
      {
        path: "ranking",
        Component: Ranking,
      },
      {
        path: "qr-generator",
        Component: QrGenerator,
      },
    ],
  },
]);
