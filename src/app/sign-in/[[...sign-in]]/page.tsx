import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-navy text-white font-bold text-lg">
            ER
          </div>
          <h1 className="text-xl font-bold text-gray-900">Excel Roofing CES</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to access your projects</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
