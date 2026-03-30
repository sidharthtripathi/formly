import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Formly</h1>
        <p className="text-muted-foreground">AI-Powered Form Builder</p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/login"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Sign In
          </Link>
          <Link
            href="/builder/new"
            className="px-4 py-2 border border-input rounded-md"
          >
            Create Form
          </Link>
        </div>
      </div>
    </div>
  );
}
