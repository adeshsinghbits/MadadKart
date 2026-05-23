import Link from 'next/link';
import { ProjectService } from '@/lib/services/project.service';

const stats = [
  { label: 'Projects Created', value: '500+', icon: '🚀' },
  { label: 'Donors & Volunteers', value: '10K+', icon: '🤝' },
  { label: 'Total Impact', value: '₹50L+', icon: '💰' },
  { label: 'Cities Covered', value: '120+', icon: '📍' },
];

const features = [
  { icon: '🗺️', title: 'Interactive Map', description: 'Discover projects near you with our live Leaflet-powered map with clustering.' },
  { icon: '💝', title: 'Smart Donations', description: 'Donate money or items, set up recurring contributions, track your impact.' },
  { icon: '🏆', title: 'Gamification', description: 'Earn badges, build streaks, and climb the impact leaderboard.' },
  { icon: '👥', title: 'Social Profiles', description: 'Public profiles with portfolios, followers, and verified NGO badges.' },
  { icon: '📊', title: 'Transparency', description: 'Live updates, milestone tracking, and full audit logs.' },
  { icon: '🤖', title: 'AI Powered', description: 'Personalized project recommendations based on your interests.' },
];

export default async function Home() {
  let platformStats = { totalProjects: 0, totalDonations: 0 };
  try {
    platformStats = await ProjectService.getStats() as any;
  } catch {}

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-linear(circle at 25% 25%, rgba(139,92,246,0.4) 0%, transparent 50%), radial-linear(circle at 75% 75%, rgba(59,130,246,0.4) 0%, transparent 50%)' }} />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm px-4 py-1.5 rounded-full border border-white/20 mb-8">
            🌟 India's leading social impact platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Make Real <span className="bg-linear-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Social Impact</span><br />Together
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
            Connect with NGOs, donate to causes, volunteer for projects, and track your impact — all in one ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore" className="px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-white/90 transition-all shadow-lg shadow-white/10">
              Explore Projects
            </Link>
            <Link href="/register" className="px-8 py-4 bg-linear-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all">
              Join Free →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-border py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to create impact</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">A complete ecosystem for social good — not just another donation page.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="p-6 rounded-2xl border border-border bg-white hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-linear-to-r from-primary to-purple-600 text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to create impact?</h2>
          <p className="text-white/80 mb-8 text-lg">Join thousands of changemakers already using MadadKart.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="px-8 py-4 bg-white text-primary rounded-xl font-bold hover:bg-white/90 transition-all">
              Get started free
            </Link>
            <Link href="/map" className="px-8 py-4 bg-white/10 text-white border border-white/30 rounded-xl font-bold hover:bg-white/20 transition-all">
              View Map
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}