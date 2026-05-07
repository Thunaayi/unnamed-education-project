export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <main className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">9th Grade Exam Prep</h1>
        <p className="text-lg text-gray-600 mb-8">Pakistan Board Exam Preparation Platform</p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </a>
      </main>
    </div>
  );
}
