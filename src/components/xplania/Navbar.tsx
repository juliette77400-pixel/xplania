import { Plane } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Xplania</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            Fonctionnalités
          </a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            Comment ça marche
          </a>
          <a href="#feedback" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            Feedback
          </a>
        </div>

        <a
          href="#create"
          className="gradient-button px-5 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Créer mon voyage
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
