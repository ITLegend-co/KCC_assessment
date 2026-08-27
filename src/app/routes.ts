import { createHashRouter } from "react-router-dom";
import Root from "./pages/Root";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import StudentRegistration from "./pages/StudentRegistration";
import JudgeScoring from "./pages/JudgeScoring";
import Ranking from "./pages/Ranking";
import RankingOnly from "./pages/RankingOnly";

export const router = createHashRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/ranking-only",
    Component: RankingOnly,
  },
  {
    path: "/",
    Component: Root,
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
    ],
  },
]);
