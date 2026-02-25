'use client';

import Link from 'next/link';
import {
  Briefcase,
  MapPin,
  Shield,
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-sky-300/20 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      {/* Note: We are using a custom nav here for the landing page specific interactions. 
          The global Navbar in layout.tsx might need to be conditionally hidden if desired, 
          but for now this sits under it or we can rely on layout.
          If layout Navbar is transparent/sticky, this might duplicate. 
          Assuming layout Navbar is simple, we might want to hide it or style it. 
          For this prompt, I will assume we want THIS to be the main view content.
      */}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-blue-100 backdrop-blur-sm shadow-sm mb-8 text-sm font-medium text-blue-800">
            <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
            Connecting Workers & Employers Seamlessly
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
            The Bridge Between <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Talent</span> and <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">Opportunity</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed">
            WorkBridge is the trusted marketplace for skilled labourers and employers.
            Smart matching, digital work passports, and location-based discovery tailored for the modern workforce.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-full overflow-hidden transition-all hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-full transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Hero Image / Illustration Placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-16 sm:mt-24 relative w-full max-w-5xl"
        >
          <div className="relative rounded-2xl overflow-hidden glass border-white/40 shadow-2xl aspect-[16/9] sm:aspect-[2/1] bg-slate-100 flex items-center justify-center">
            {/* Abstract UI Representation */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50/50"></div>
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 p-8 w-full max-w-4xl opacity-90">
              {/* Mock Card 1 */}
              <div className="bg-white rounded-xl shadow-lg p-5 border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="h-2.5 w-24 bg-slate-200 rounded-full mb-1"></div>
                    <div className="h-2 w-16 bg-slate-100 rounded-full"></div>
                  </div>
                </div>
                <div className="h-20 bg-slate-50 rounded-lg w-full"></div>
                <div className="flex gap-2 mt-auto">
                  <div className="h-8 w-full bg-blue-600 rounded-md opacity-90"></div>
                </div>
              </div>
              {/* Mock Card 2 (Center - Prominent) */}
              <div className="bg-white rounded-xl shadow-xl p-6 border border-slate-100 flex flex-col gap-4 scale-110 z-10">
                <div className="flex justify-between items-center">
                  <div className="h-3 w-1/3 bg-slate-200 rounded-full"></div>
                  <div className="h-6 w-12 bg-green-100 text-green-700 rounded-full text-xs flex items-center justify-center font-bold">98%</div>
                </div>
                <div className="h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-blue-400 opacity-50" />
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                  <div className="h-2 w-4/5 bg-slate-100 rounded-full"></div>
                  <div className="h-2 w-2/3 bg-slate-100 rounded-full"></div>
                </div>
              </div>
              {/* Mock Card 3 */}
              <div className="bg-white rounded-xl shadow-lg p-5 border border-slate-100 flex flex-col gap-3 hidden sm:flex">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="h-2.5 w-20 bg-slate-200 rounded-full mb-1"></div>
                    <div className="h-2 w-12 bg-slate-100 rounded-full"></div>
                  </div>
                </div>
                <div className="h-20 bg-slate-50 rounded-lg w-full"></div>
                <div className="flex gap-2 mt-auto">
                  <div className="h-8 w-full bg-slate-800 rounded-md opacity-90"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative gradients behind image */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 -z-10"></div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 sm:text-4xl">Built for the Modern Workforce</h2>
            <p className="text-lg text-slate-600">Everything you need to hire efficiently, get hired quickly, and build a verified professional reputation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Users className="w-6 h-6 text-white" />,
                title: "Smart Matching",
                desc: "AI-powered algorithms match workers with the right jobs based on skills, location, and ratings.",
                color: "bg-blue-600"
              },
              {
                icon: <MapPin className="w-6 h-6 text-white" />,
                title: "Location-Based",
                desc: "Find jobs and workers near you with integrated Google Maps and real-time distance search.",
                color: "bg-indigo-600"
              },
              {
                icon: <Briefcase className="w-6 h-6 text-white" />,
                title: "Digital Passport",
                desc: "Build a verified work history with ratings, reviews, and earnings — your portable identity.",
                color: "bg-violet-600"
              },
              {
                icon: <Shield className="w-6 h-6 text-white" />,
                title: "Secure & Trusted",
                desc: "Verified profiles, role-based access, and secure payment tracking you can rely on.",
                color: "bg-emerald-600"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-6 shadow-md shadow-blue-900/5 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 sm:text-4xl">How WorkBridge Works</h2>
              <div className="space-y-8">
                {[
                  { step: "01", title: "Create Your Profile", desc: "Sign up and build your digital work passport with skills and experience." },
                  { step: "02", title: "Get Matched", desc: "Our AI connects you with Opportunities or Talent that meet your exact needs." },
                  { step: "03", title: "Work & Earn", desc: "Complete the job, get paid securely, and receive verified ratings." }
                ].map((s, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border border-blue-100 flex items-center justify-center text-blue-600 font-bold shadow-sm">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-slate-900 mb-2">{s.title}</h4>
                      <p className="text-slate-600">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-8">
                  {/* Simplified Interface Illustration */}
                  <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-lg p-6 text-white border border-white/20">
                    <div className="flex justify-between items-center mb-8">
                      <div className="h-4 w-24 bg-white/30 rounded-full"></div>
                      <div className="h-8 w-8 rounded-full bg-white/30"></div>
                    </div>
                    <div className="space-y-4">
                      <div className="h-16 w-full bg-white/20 rounded-lg"></div>
                      <div className="h-16 w-full bg-white/20 rounded-lg"></div>
                      <div className="h-16 w-full bg-white/20 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-slate-50 flex items-center gap-3 animate-bounce duration-[3000ms]">
                <div className="bg-green-100 p-2 rounded-full text-green-600">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Verified Worker</p>
                  <p className="text-xs text-slate-500">ID Checked</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-16 sm:text-4xl">Trusted by Professionals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Sarah Campbell", role: "Project Manager", quote: "WorkBridge revolutionized how we find temporary skilled labor. The matching is incredibly accurate." },
              { name: "David Chen", role: "Electrician", quote: "I've built a solid client base purely through WorkBridge. The digital passport feature establishes instant trust." },
              { name: "Marcus Rodriguez", role: "Site Supervisor", quote: "Secure payments and location tracking make managing remote crews so much easier. Highly recommend." }
            ].map((t, i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-2xl relative">
                <div className="flex gap-1 text-yellow-500 mb-4">
                  {[...Array(5)].map((_, stars) => <Star key={stars} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-700 mb-6 italic">"{t.quote}"</p>
                <div>
                  <p className="font-bold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-blue-600 rounded-3xl p-8 sm:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">Ready to Transform Your Workflow?</h2>
            <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">Join thousands of workers and employers already building the future of work with WorkBridge.</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              Create Your Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
                <Briefcase className="w-6 h-6 text-blue-600" />
                WorkBridge
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed">
                The trusted marketplace connecting skilled labourers with employers through smart matching and secure tools.
              </p>
            </div>
            {/* Links Columns */}
            {[
              { header: "Platform", links: ["Browse Jobs", "Find Workers", "Pricing", "Enterprise"] },
              { header: "Company", links: ["About Us", "Careers", "Blog", "Contact"] },
              { header: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Verification"] }
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-bold text-slate-900 mb-4">{col.header}</h4>
                <ul className="space-y-2 text-sm text-slate-500">
                  {col.links.map((link, j) => (
                    <li key={j}><Link href="#" className="hover:text-blue-600 transition-colors">{link}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© 2026 WorkBridge. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-slate-900">Twitter</Link>
              <Link href="#" className="hover:text-slate-900">LinkedIn</Link>
              <Link href="#" className="hover:text-slate-900">Instagram</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

