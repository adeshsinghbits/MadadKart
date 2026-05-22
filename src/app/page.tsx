import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Make Social Impact Today
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Discover and support meaningful projects that help underprivileged
            communities, protect the environment, and create positive change.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-lg"
            >
              Explore Projects
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 text-lg"
            >
              Get Started
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Support Communities
            </h3>
            <p className="text-gray-600">
              Help underprivileged communities get the resources they need to
              thrive.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Protect Nature
            </h3>
            <p className="text-gray-600">
              Support environmental projects that preserve our planet for future
              generations.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Local & Global
            </h3>
            <p className="text-gray-600">
              Find projects near you or support causes around the world.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Browse</h4>
              <p className="text-gray-600 text-sm">
                Explore projects from creators around the region
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Learn</h4>
              <p className="text-gray-600 text-sm">
                Read detailed information and support needs
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Donate</h4>
              <p className="text-gray-600 text-sm">
                Support projects with donations or messages
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Impact</h4>
              <p className="text-gray-600 text-sm">
                Be part of creating real social change
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Ready to Make a Difference?
          </h2>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-lg"
          >
            Create Account & Start Today
          </Link>
        </div>
      </div>
    </div>
  );
}
