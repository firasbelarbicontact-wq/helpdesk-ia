import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHeadset } from 'react-icons/fa';
import { FiGrid, FiPlusCircle, FiSettings, FiLogOut, FiUser, FiX, FiTool } from 'react-icons/fi';

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/tickets/new') return location.pathname === '/tickets/new';
    return location.pathname.startsWith(path);
  };

  const linkBase = 'flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium';
  const activeLink = 'bg-white text-slate-900 shadow-sm';
  const inactiveLink = 'text-slate-400 hover:bg-slate-800 hover:text-white';

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-900 transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ].join(' ')}
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
        <h1 className="flex items-center gap-3 text-lg font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <FaHeadset className="text-lg" />
          </span>
          HelpDesk IA
        </h1>
        <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden">
          <FiX className="text-xl" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <Link to="/profile" onClick={onClose} className={`${linkBase} ${isActive('/profile') ? activeLink : inactiveLink}`}>
          <FiUser className="mr-3 text-base" /> Mon Profil
        </Link>
        <Link to="/dashboard" onClick={onClose} className={`${linkBase} ${isActive('/dashboard') && !isActive('/tickets/new') ? activeLink : inactiveLink}`}>
          <FiGrid className="mr-3 text-base" /> Tableau de bord
        </Link>

        {user?.role === 'EMPLOYE' && (
          <Link to="/tickets/new" onClick={onClose} className={`${linkBase} ${isActive('/tickets/new') ? activeLink : inactiveLink}`}>
            <FiPlusCircle className="mr-3 text-base" /> Nouveau Ticket
          </Link>
        )}

        {user?.role === 'ADMIN' && (
          <>
            <div className="pt-4 pb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Administration</div>
            <Link to="/admin" onClick={onClose} className={`${linkBase} ${isActive('/admin') && !isActive('/admin/technicians') ? activeLink : inactiveLink}`}>
              <FiSettings className="mr-3 text-base" /> Utilisateurs
            </Link>
            <Link to="/admin/technicians" onClick={onClose} className={`${linkBase} ${isActive('/admin/technicians') ? activeLink : inactiveLink}`}>
              <FiTool className="mr-3 text-base" /> Audit Techniciens
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-lg px-4 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
        >
          <FiLogOut className="mr-3 text-base" /> Déconnexion
        </button>
      </div>
    </aside>
  );
}