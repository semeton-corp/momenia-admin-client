import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAccessToken,
  getGoogleSignInRedirectUrl,
  saveAuthTokensFromUrl,
} from "@/lib/auth";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAccessToken = Boolean(getAccessToken());

  useEffect(() => {
    const savedTokens = saveAuthTokensFromUrl(new URL(window.location.href));

    if (savedTokens) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  if (hasAccessToken) {
    return <Navigate to="/" replace />;
  }

  const redirectToGoogle = async () => {
    setIsRedirecting(true);
    setError(null);

    try {
      const redirectUrl = await getGoogleSignInRedirectUrl();

      window.location.assign(redirectUrl);
    } catch {
      setError("Google login could not start. Please try again.");
      setIsRedirecting(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-sm rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div>TEST CI/CD
        </div>
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-muted-foreground">Memoria Admin</p>
          <h1 className="text-2xl font-semibold tracking-normal">Login required</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Use your Google account to continue.
          </p>
        </div>

        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={redirectToGoogle}
          disabled={isRedirecting}
        >
          <Chrome />
          {isRedirecting ? "Opening Google..." : "Login with Google"}
        </Button>

        {error && <p className="mt-4 text-center text-xs text-destructive">{error}</p>}

        {location.state && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Your session has expired. Please login again.
          </p>
        )}
      </section>
    </main>
  );
}
