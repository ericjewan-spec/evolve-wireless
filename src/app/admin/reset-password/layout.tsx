export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reset password — Evolve",
  robots: { index: false, follow: false, nocache: true },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  // Intentionally no AdminGate — the user follows the email link in an unauthenticated state,
  // Supabase exchanges the token for a session, then we let them set a new password.
  return <>{children}</>;
}
