import { RouterProvider } from 'react-router';
import { router } from './routes';
import { KccWallDecor } from './components/KccBrand';
import { ThemeProvider, ThemeToggle } from './components/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <KccWallDecor />
      <ThemeToggle />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
