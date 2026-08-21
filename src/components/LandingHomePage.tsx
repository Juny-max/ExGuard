import React from 'react';
import {
  ShieldCheckIcon,
  QrCodeIcon,
  SparklesIcon,
  BellAlertIcon,
  TagIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  DevicePhoneMobileIcon,
  CameraIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface LandingHomePageProps {
  onNavigateLogin: () => void;
  onNavigateSignUp: () => void;
  onOpenDemoStore: () => void;
}

export const LandingHomePage: React.FC<LandingHomePageProps> = ({
  onNavigateLogin,
  onNavigateSignUp,
  onOpenDemoStore,
}) => {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-emerald-950/95 backdrop-blur-md border-b border-emerald-800 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shrink-0">
              <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <span className="text-base sm:text-xl font-black tracking-tight flex items-center gap-1.5 leading-none">
                <span>ExpiryGuard</span>
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 uppercase tracking-widest hidden xs:inline-block">
                  SaaS
                </span>
              </span>
              <p className="text-[10px] sm:text-[11px] text-emerald-300 hidden md:block font-medium mt-0.5">
                Supermarket Shelf-Life & Expiry Control System
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onNavigateLogin}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-emerald-100 hover:text-white hover:bg-emerald-900/60 rounded-xl transition-all cursor-pointer border border-emerald-800"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onNavigateSignUp}
              className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1 sm:gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white pt-8 sm:pt-16 pb-14 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-emerald-800">
        <div className="max-w-5xl mx-auto text-center space-y-5 sm:space-y-7">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-emerald-800/80 border border-emerald-600 text-emerald-200 text-[11px] sm:text-xs font-semibold shadow-xs max-w-full text-left sm:text-center">
            <SparklesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <span className="truncate sm:whitespace-normal">Zero Unsold Expired Stock • Smart Clearance Markdown</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight sm:leading-tight px-1">
            Stop Food Waste & Expiry Losses in Your Supermarket
          </h1>

          {/* Subtitle */}
          <p className="text-xs xs:text-sm sm:text-lg lg:text-xl text-emerald-100/90 max-w-3xl mx-auto font-normal leading-relaxed px-2">
            ExpiryGuard delivers real-time lot tracking, camera barcode scanning, automatic clearance markdown rules, and cashier POS verification terminals for retail grocery stores.
          </p>

          {/* Call to Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto w-full px-2">
            <button
              type="button"
              onClick={onNavigateSignUp}
              className="w-full sm:w-auto px-6 py-3 sm:py-3.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-xs sm:text-sm md:text-base font-black rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>Create Store Account</span>
              <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={onOpenDemoStore}
              className="w-full sm:w-auto px-6 py-3 sm:py-3.5 bg-emerald-900/80 hover:bg-emerald-800 text-white text-xs sm:text-sm md:text-base font-bold rounded-xl border border-emerald-600 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <BuildingStorefrontIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
              <span>Explore Live Demo Store</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-6 sm:pt-10 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-4xl mx-auto">
            <div className="bg-emerald-900/60 border border-emerald-800/80 p-3 sm:p-4 rounded-2xl backdrop-blur-xs text-left">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400 block">99.8%</span>
              <span className="text-[10px] sm:text-xs text-emerald-200 font-medium">Expired Item Detection</span>
            </div>
            <div className="bg-emerald-900/60 border border-emerald-800/80 p-3 sm:p-4 rounded-2xl backdrop-blur-xs text-left">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400 block">-38%</span>
              <span className="text-[10px] sm:text-xs text-emerald-200 font-medium">Food Waste Reduction</span>
            </div>
            <div className="bg-emerald-900/60 border border-emerald-800/80 p-3 sm:p-4 rounded-2xl backdrop-blur-xs text-left">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400 block">120ms</span>
              <span className="text-[10px] sm:text-xs text-emerald-200 font-medium">Barcode Scan Speed</span>
            </div>
            <div className="bg-emerald-900/60 border border-emerald-800/80 p-3 sm:p-4 rounded-2xl backdrop-blur-xs text-left">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400 block">100%</span>
              <span className="text-[10px] sm:text-xs text-emerald-200 font-medium">Audit Compliance Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities & Value Proposition */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10 sm:space-y-14">
        <div className="text-center max-w-3xl mx-auto space-y-2 sm:space-y-3">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700">
            Engineered For Modern Grocery Operations
          </span>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight">
            Everything You Need to Protect Shelf Quality & Margins
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-stone-600">
            From intake receiving at the loading dock to fast verification at the checkout counter.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Feature 1 */}
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-shadow space-y-3 sm:space-y-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CameraIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">Live Camera Barcode Scanner</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Reticle barcode scanning on mobile phone cameras and desktop webcams. Decodes UPC, EAN-13, and Code 128 instantly with audio verification beeps.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-shadow space-y-3 sm:space-y-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <BellAlertIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">Tiered Expiry Alert Matrix</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Automated status classification separates batches into Fresh, Expiring in 30 Days, Critical (7 Days), and Expired with high-visibility color codes.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-shadow space-y-3 sm:space-y-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <TagIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">Smart Markdown & Clearance</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Automatically calculate dynamic promotional discounts (20%, 40%, 60% off) for items nearing expiration to maximize revenue before disposal.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-shadow space-y-3 sm:space-y-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <QrCodeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">POS Checkout Verification</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Dedicated lightweight terminal mode for cashiers. Prevents accidental sale of expired groceries and alerts cashiers to apply markdown prices.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-shadow space-y-3 sm:space-y-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <TrashIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">Auditable Disposal Logging</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Log bio-waste, compost, and landfill disposals with manager sign-offs, disposal batch notes, and printable PDF audit compliance certificates.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-shadow space-y-3 sm:space-y-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <BuildingStorefrontIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">Multi-Store & Branch Hierarchy</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Seamlessly switch between multiple branches, manage cashier personnel credentials, and monitor department-level shelf life from one dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works - Step by Step Workflow */}
      <section className="bg-emerald-900 text-white py-12 sm:py-20 px-4 sm:px-6 lg:px-8 border-y border-emerald-800">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2 sm:space-y-3">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-300">
              Simple 3-Step Store Workflow
            </span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              How ExpiryGuard Powers Your Supermarket Floor
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-emerald-950/60 p-5 sm:p-7 rounded-2xl border border-emerald-800/80 space-y-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white font-black text-base sm:text-lg flex items-center justify-center">
                1
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">Log Batches on Delivery</h3>
              <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
                Scan incoming manufacturer barcodes with your phone or handheld reader. Enter expiration dates and aisle locations in under 10 seconds.
              </p>
            </div>

            <div className="bg-emerald-950/60 p-5 sm:p-7 rounded-2xl border border-emerald-800/80 space-y-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white font-black text-base sm:text-lg flex items-center justify-center">
                2
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">Automated Markdown & Clearance</h3>
              <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
                System flags batches 30, 15, and 7 days prior to expiry. Apply quick discount stickers to convert at-risk inventory into immediate sales.
              </p>
            </div>

            <div className="bg-emerald-950/60 p-5 sm:p-7 rounded-2xl border border-emerald-800/80 space-y-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white font-black text-base sm:text-lg flex items-center justify-center">
                3
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">POS Shield & Waste Audit</h3>
              <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
                Cashiers verify items at checkout. Expired items are blocked and routed to verified disposal with complete regulatory compliance logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Comparison: Store Manager vs Cashier */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 sm:space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700">
            Tailored User Experiences
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Built Specifically for Every Team Member
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8">
          {/* Store Owner / Manager Card */}
          <div className="bg-white p-5 sm:p-8 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-5 sm:space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <BuildingStorefrontIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-stone-900">Store Owners & Managers</h3>
                <span className="text-xs text-emerald-700 font-semibold">Full Governance & Analytics</span>
              </div>
            </div>

            <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-stone-700">
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Executive dashboard tracking inventory at risk, waste trends, and salvage revenue</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Category and department shelf-life management (Dairy, Bakery, Produce, Meat)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Cashier staff onboarding, branch creation, and audit report generation</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={onNavigateLogin}
              className="w-full py-2.5 sm:py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer text-center"
            >
              Sign In as Store Manager
            </button>
          </div>

          {/* Cashier / Floor Staff Card */}
          <div className="bg-white p-5 sm:p-8 rounded-2xl border-2 border-stone-200 shadow-xs space-y-5 sm:space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-stone-800 text-white flex items-center justify-center shrink-0">
                <DevicePhoneMobileIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-stone-900">Cashiers & Floor Audit Staff</h3>
                <span className="text-xs text-stone-600 font-semibold">Fast POS & Shelf Scanning</span>
              </div>
            </div>

            <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-stone-700">
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Distraction-free fast scanner screen optimized for mobile and POS hardware</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Immediate visual pass/fail indicators with high-contrast safety banners</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Promotional clearance price prompts to ensure customer discount accuracy</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={onNavigateLogin}
              className="w-full py-2.5 sm:py-3 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer text-center"
            >
              Sign In as Cashier
            </button>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Banner */}
      <section className="bg-emerald-950 text-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-t border-emerald-800 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 text-center md:text-left">
          <div className="space-y-1.5 sm:space-y-2">
            <h3 className="text-lg sm:text-2xl font-bold">Ready to eliminate supermarket expiry losses?</h3>
            <p className="text-xs sm:text-sm text-emerald-300">
              Set up your store, branches, and cashiers in less than 2 minutes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onNavigateSignUp}
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer text-center"
            >
              Start Free Trial
            </button>
            <button
              type="button"
              onClick={onNavigateLogin}
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-emerald-900 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl border border-emerald-700 transition-all cursor-pointer text-center"
            >
              Member Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-950 border-t border-emerald-900 py-5 px-4 text-center text-xs text-emerald-400">
        <p>© 2026 ExpiryGuard Supermarket Systems. All rights reserved.</p>
      </footer>
    </div>
  );
};
