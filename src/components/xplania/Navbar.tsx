import { Plane, BookOpen, LogOut, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  onCreateTrip: () => void;
  onFeedback: () => void;
}

const Navbar = ({ onCreateTrip, onFeedback }: Props) => {
  const { user, signOut } = useAuth();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Xplania</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            Fonctionnalités
          </a>
          <a href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            Comment ça marche
          </a>
          <Link to="/offres" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            Offres
          </Link>
          <Link to="/carnets" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium flex items-center gap-1">
            <BookOpen className="w-4 h-4" /> Mes carnets
          </Link>
          <button onClick={onFeedback} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            Feedback
          </button>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={signOut}
              className="hidden sm:flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm px-3 py-2"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm px-3 py-2"
            >
              <LogIn className="w-4 h-4" /> Connexion
            </Link>
          )}
          <button
            onClick={onCreateTrip}
            className="gradient-button px-5 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Créer mon voyage
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
