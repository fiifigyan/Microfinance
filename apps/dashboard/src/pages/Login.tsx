import { SignIn } from "@clerk/clerk-react";

export default function Login() {
  return (
    <div className="min-h-screen bg-blue-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Microfinance</h1>
        <p className="text-blue-300 mt-1 text-sm">Staff Dashboard — Administrators &amp; Agents</p>
      </div>
      <SignIn
        routing="hash"
        afterSignInUrl="/"
        appearance={{
          elements: {
            card: "shadow-xl rounded-2xl",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
          },
        }}
      />
    </div>
  );
}
