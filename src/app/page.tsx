export default function HomePage() {
  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 dark:from-blue-900/30 dark:to-purple-900/30"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300/30 dark:bg-blue-700/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-300/30 dark:bg-purple-700/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
            GoldCare AI
          </h1>
          <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 max-w-3xl mb-8 leading-relaxed">
            An ethical AI grounded in moral principles and trusted sources, designed for responsible, transparent, and life-respecting medical decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/client"
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 transition"
            >
              🔍 Go to Playground
            </a>
            <a
              href="#about"
              className="rounded-full border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium px-6 py-3 transition"
            >
              About
            </a>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section id="about" className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-6">How It Works</h2>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            GoldCare AI integrates authorized sources — books, articles, and ethical contexts — with an <strong>inviolable moral domain</strong> based on Jewish principles such as the sanctity of life (pikuach nefesh) and the duty to heal.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Source Ingestion</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Add books, articles, or structured ethical contexts. Each source is categorized by tier (Tier 1–3) and moral domain.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
              <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Moral Domain</h3>
            <p className="text-slate-600 dark:text-slate-400">
              The &quot;Moral Foundations&quot; domain serves as a non-negotiable ethical foundation. No recommendation can violate its principles.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <span className="text-green-600 dark:text-green-400 font-bold">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Contextual Search</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Ask questions and the AI responds based on sources, prioritizing Tier 1 and applying defined ethical rules.
            </p>
          </div>
        </div>
      </section>

      {/* Playground Section */}
      <section className="bg-white dark:bg-slate-800 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Interactive Playground</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Test GoldCare AI in real time. Insert data, ask questions, and see how the AI responds with ethical grounding.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h3 className="font-semibold mb-3">Example Question</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-4 rounded-md">
                  <strong>What is the role of autonomy in Jewish medical ethics?</strong>
                </p>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-3">How to Test</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                  <li>• Go to <strong>Search Playground</strong></li>
                  <li>• Edit instructions or moral foundation</li>
                  <li>• Click &quot;Search Response&quot;</li>
                  <li>• View sources used and justification</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 text-center">
              <a
                href="/client/search"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-3 transition"
              >
                <span>🚀 Open Playground</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 text-center text-slate-600 dark:text-slate-400 text-sm">
        <p>
          Built with ❤️ for ethical and responsible AI.
        </p>
        <p className="mt-2">
          Based on Jewish principles, science, and transparency.
        </p>
      </footer>
    </div>
  );
}