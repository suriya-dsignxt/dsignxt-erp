import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Github, Linkedin } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 bg-white shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Image src="/promptix-logo-dark.png" alt="PromptiX" width={200} height={200} className="h-20 w-auto object-contain scale-110 origin-left" />
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-5 py-2 text-sm font-medium text-navy-900 hover:text-orange-500 transition-colors">
            Log In
          </Link>
          <Link href="/login" className="px-5 py-2 text-sm font-medium bg-navy-900 text-white rounded hover:bg-navy-800 transition-colors shadow-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
        <div className="max-w-4xl mx-auto mt-16 sm:mt-24">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-navy-900 tracking-tight mb-6 leading-tight">
            Manage your <span className="text-orange-500">Talent</span>.<br />
            Empower your <span className="text-navy-900">Growth</span>.
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            The all-in-one CRM & Learning Management System designed for modern organizations. Track attendance, manage leaves, and organize events seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/login" className="px-8 py-4 bg-orange-500 text-white rounded-lg text-lg font-semibold hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Enter Portal
            </Link>
            <a href="#" className="px-8 py-4 bg-gray-100 text-navy-900 rounded-lg text-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-200">
              Learn More
            </a>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-12 mb-20 px-4 max-w-4xl mx-auto">
            <FeatureCard
              icon="📊"
              title="Smart Analytics"
              desc="Real-time dashboards for attendance, performance, and operational insights."
            />
            <FeatureCard
              icon="📅"
              title="Event Scheduling"
              desc="Organize workshops and sessions with built-in registration and feedback systems."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-navy-900 text-gray-400 py-12 px-8 text-center sm:text-left">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <span className="text-xl font-bold text-white tracking-tight mb-4 block">PromptiX</span>
            <p className="text-sm mb-6">Empowering the next generation of professionals.</p>
            <div className="flex gap-4 justify-center sm:justify-start">
              <a href="https://www.instagram.com/promptix_tech?igsh=MWYxOGV0OWh2ZGF2OQ==" target="_blank" rel="noopener noreferrer" className="p-3 bg-navy-800 rounded-full hover:bg-orange-500 text-white transition-all">
                <Instagram size={24} />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61585508464984" target="_blank" rel="noopener noreferrer" className="p-3 bg-navy-800 rounded-full hover:bg-orange-500 text-white transition-all">
                <Facebook size={24} />
              </a>
              <a href="https://github.com/infopromptix-edtech" target="_blank" rel="noopener noreferrer" className="p-3 bg-navy-800 rounded-full hover:bg-orange-500 text-white transition-all">
                <Github size={24} />
              </a>
              <a href="https://www.linkedin.com/in/promptix-tech-solutions-9618a63a2/" target="_blank" rel="noopener noreferrer" className="p-3 bg-navy-800 rounded-full hover:bg-orange-500 text-white transition-all">
                <Linkedin size={24} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-orange-500">About Us</a></li>
              <li><a href="https://promptix.pro/company/team" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500">Careers</a></li>
              <li><a href="https://promptix.pro/blog" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://promptix.pro/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500">Privacy</a></li>
              <li><a href="https://promptix.pro/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-navy-800 pt-8 text-center text-sm">
          © {new Date().getFullYear()} PromptiX Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-xl border border-gray-100 hover:border-orange-500/30 hover:shadow-lg transition-all bg-white group">
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-xl font-bold text-navy-900 mb-2">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
