import { Outlet } from 'react-router';
import { KccFooter } from '../components/KccBrand';

export default function Root() {
  return <div className="kcc-app-shell"><Outlet /><KccFooter /></div>;
}
