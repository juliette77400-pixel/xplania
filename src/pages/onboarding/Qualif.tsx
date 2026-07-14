import { Navigate } from "react-router-dom";

// The mini-qualification step has been removed from the primary onboarding.
// Keep this file as a compatibility redirect so any stale link resumes the
// user on the "needs" step.
const Qualif = () => <Navigate to="/onboarding/besoin" replace />;

export default Qualif;
