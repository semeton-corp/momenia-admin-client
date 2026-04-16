import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { signInWithGoogleCode } from "@/lib/auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const [error, setError] = useState<string | null>(() =>
    code ? null : "Google did not return a login code.",
  );

  useEffect(() => {
    if (!code) {
      return;
    }

    let isMounted = true;

    signInWithGoogleCode(code)
      .then(() => {
        if (isMounted) {
          navigate("/", { replace: true });
        }
      })
      .catch((signInError) => {
        if (isMounted) {
          setError(
            signInError instanceof Error
              ? signInError.message
              : "Google login failed. Please try again.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [code, navigate]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-sm rounded-lg border bg-card p-6 text-center text-card-foreground shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Memoria Admin</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal">
          {error ? "Login failed" : "Signing you in"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {error ?? "Please wait while we finish Google login."}
        </p>

        {error && (
          <Button asChild className="mt-6 w-full" size="lg">
            <Link to="/login" replace>
              Back to login
            </Link>
          </Button>
        )}
      </section>
    </main>
  );
}
