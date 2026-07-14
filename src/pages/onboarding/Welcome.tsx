import { Navigate } from "react-router-dom";

// The old "/welcome" screen has been replaced by the anonymous Tinder deck at
// the root route. Keep this file as a compatibility redirect for any stale
// link or bookmark.
const Welcome = () => <Navigate to="/" replace />;

export default Welcome;
