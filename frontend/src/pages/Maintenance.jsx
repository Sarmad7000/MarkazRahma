import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Copy, Landmark, MapPin, Wallet } from 'lucide-react';
import { Button } from '../components/ui/button';
import Header from '../components/sections/Header';
import Footer from '../components/sections/Footer';
import { mosqueInfo, donationInfo } from '../data/mock';
import { maintenanceTracker } from '../data/maintenance';
import { createDonationCheckout, getMonthlyRaised, getRecentDonations } from '../services/api';

const PAYPAL_URL = 'http://paypal.me/markazalrahma';
const AMOUNT_PRESETS = [5, 10, 20, 50, 100, 200];

const formatExact = (amount) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

const cardCharge = (net, coverFee) => {
  if (!coverFee) return net;
  return Math.round(((net + 0.2) / (1 - 0.015)) * 100) / 100;
};

const chargeWhen = (frequency) => {
  if (frequency === 'day') return 'a day';
  if (frequency === 'week') return 'a week';
  if (frequency === 'month') return 'a month';
  return 'paid once';
};

const formatPounds = (amount) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(amount);

const profileLinks = [
  { id: 'site', label: 'www.markazrahma.org', href: 'https://www.markazrahma.org' },
  { id: 'youtube', label: 'www.youtube.com/@markazrahma', href: 'https://www.youtube.com/@markazrahma' },
  { id: 'tiktok', label: 'www.tiktok.com/@markazalrahma', href: 'https://www.tiktok.com/@markazalrahma' },
  { id: 'mixlr', label: 'www.mixlr.com/markazalrahma', href: 'https://www.mixlr.com/markazalrahma' },
  { id: 'x', label: 'www.x.com/markazrahma', href: 'https://www.x.com/markazrahma' },
];

const ProfileIcon = ({ id }) => {
  if (id === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#FF0000" d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6z" />
        <path fill="#fff" d="M9.8 15.5v-6.6l6.2 3.3-6.2 3.3z" />
      </svg>
    );
  }
  if (id === 'tiktok') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#111" d="M14.5 3c.4 2.4 1.8 4.1 4.2 4.4v2.4c-1.4 0-2.7-.4-4-1.2v6.6c0 3.3-2.6 5.8-6 5.8S2.7 18.5 2.7 15.2c0-3.2 2.5-5.7 5.7-5.8v2.6c-1.7.1-3 1.5-3 3.2 0 1.8 1.4 3.2 3.2 3.2s3.3-1.4 3.3-3.2V3h2.6z" />
      </svg>
    );
  }
  if (id === 'mixlr') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <circle cx="7" cy="9" r="1.3" fill="#e11d48" />
        <circle cx="12" cy="7" r="1.3" fill="#e11d48" />
        <circle cx="17" cy="9" r="1.3" fill="#e11d48" />
        <circle cx="8.5" cy="13.5" r="1.3" fill="#e11d48" />
        <circle cx="12" cy="12" r="1.3" fill="#e11d48" />
        <circle cx="15.5" cy="13.5" r="1.3" fill="#e11d48" />
        <circle cx="12" cy="17" r="1.3" fill="#e11d48" />
      </svg>
    );
  }
  if (id === 'x') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#111" />
        <path fill="#fff" d="M15.6 7.5h1.5l-3.3 3.8 3.9 5.2h-3l-2.4-3.1-2.7 3.1H8.1l3.5-4L8 7.5h3.1l2.1 2.8 2.4-2.8zm-.5 8.1h.8L9 8.4h-.9l6.9 7.2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="#111" strokeWidth="1.6" />
      <path fill="none" stroke="#111" strokeWidth="1.6" d="M3 12h18M12 3c2.4 2.6 3.6 5.7 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.7-3.6-9S9.6 5.6 12 3z" />
    </svg>
  );
};

const pageLinks = [
  { href: '/events', label: 'Classes and lectures', note: 'What is on at Rahma Centre' },
  { href: '/timetable', label: 'Salah times', note: 'Iqamah through the week' },
  { href: '/youtube-recordings', label: 'Recordings', note: 'Listen back from the hall' },
];

const frequencies = [
  ['once', 'Once'],
  ['month', 'Monthly'],
  ['week', 'Weekly'],
  ['day', 'Daily'],
];

const Maintenance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [giveMode, setGiveMode] = useState('often');
  const [cadence, setCadence] = useState('month');
  const [amountInput, setAmountInput] = useState('50');
  const [coverFee, setCoverFee] = useState(true);
  const [email, setEmail] = useState('');
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitTarget, setSubmitTarget] = useState('');
  const [donateError, setDonateError] = useState('');
  const [showBank, setShowBank] = useState(false);
  const [recentGifts, setRecentGifts] = useState([]);
  const [raised, setRaised] = useState(0);
  const [totalLive, setTotalLive] = useState(false);
  const [totalStatus, setTotalStatus] = useState('loading');
  const donationResult = searchParams.get('donation');
  const { goal } = maintenanceTracker;

  const handlePayPal = () => {
    window.open(PAYPAL_URL, '_blank', 'noopener,noreferrer');
  };

  const netAmount = Number(amountInput);
  const chargeAmount = Number.isFinite(netAmount) ? cardCharge(netAmount, coverFee) : 0;
  const amountFrequency = giveMode === 'once' ? 'once' : cadence;

  useEffect(() => {
    let cancelled = false;
    getRecentDonations()
      .then((gifts) => {
        if (!cancelled) setRecentGifts(gifts);
      })
      .catch(() => {
        if (!cancelled) setRecentGifts([]);
      });
    getMonthlyRaised()
      .then((data) => {
        if (cancelled) return;
        if (data && data.live) {
          setRaised(Number(data.raised) || 0);
          setTotalLive(true);
          setTotalStatus('live');
        } else {
          setRaised(0);
          setTotalLive(false);
          setTotalStatus('unavailable');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRaised(0);
          setTotalLive(false);
          setTotalStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startCheckout = async (amount, frequency, target) => {
    setDonateError('');
    if (!Number.isFinite(amount) || amount < 1 || amount > 10000) {
      setDonateError('Enter an amount between £1 and £10,000.');
      return;
    }
    if (emailOptIn && !email.trim()) {
      setDonateError('Enter your email address.');
      return;
    }
    setSubmitting(true);
    setSubmitTarget(target);
    try {
      const checkout = await createDonationCheckout({
        amount,
        frequency,
        cover_fee: coverFee,
        email: email.trim(),
        email_opt_in: emailOptIn,
        returnPath: '/maintenance',
      });
      window.location.assign(checkout.url);
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') {
        setDonateError(detail);
      } else if (!error.response || error.response.status === 404) {
        setDonateError('This preview is not connected to the payment service yet.');
      } else {
        setDonateError('The payment page could not be opened.');
      }
      setSubmitting(false);
      setSubmitTarget('');
    }
  };

  const handleStripeDonate = (event) => {
    event.preventDefault();
    startCheckout(netAmount, giveMode === 'once' ? 'once' : cadence, 'amount');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setCopied(false);
    }
  };

  const chooseFrequency = (value) => {
    if (value === 'once') {
      setGiveMode('once');
      return;
    }
    setGiveMode('often');
    setCadence(value);
  };
  const selectedFrequency = giveMode === 'once' ? 'once' : cadence;

  return (
    <div className="min-h-screen bg-[#f3fafb] flex flex-col">
      <Header mosqueInfo={mosqueInfo} />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-100 via-cyan-50/70 to-transparent" />
          <div className="relative mx-auto max-w-3xl px-4 pb-2 pt-5 md:pt-8">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="-ml-3 mb-6 text-gray-700 hover:bg-white/70 hover:text-cyan-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">Markaz Al-Rahma</p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight text-gray-900 md:text-6xl">Donate Today</h1>
            <p className="mt-4 inline-flex rounded-full bg-white/80 px-3 py-1 text-sm text-gray-600 shadow-sm ring-1 ring-cyan-100">
              {mosqueInfo.location.address}
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">{maintenanceTracker.intro}</p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-16 pt-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(8,145,178,0.08)] ring-1 ring-cyan-100">
              <dt className="text-sm text-gray-500">Monthly running figure</dt>
              <dd className="mt-2 text-4xl font-semibold tracking-tight text-gray-900">{formatPounds(goal)}</dd>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-cyan-600 to-cyan-800 p-6 text-white shadow-[0_10px_30px_rgba(8,145,178,0.25)]">
              <dt className="text-sm text-cyan-100">Card gifts this month</dt>
              <dd className="mt-2 text-4xl font-semibold tracking-tight">{formatPounds(raised)}</dd>
              {!totalLive && (
                <dd className="mt-2 text-sm text-cyan-100">
                  {totalStatus === 'error'
                    ? 'The card total could not be loaded.'
                    : totalStatus === 'loading'
                      ? 'Loading the card total.'
                      : 'The card total is not available yet.'}
                </dd>
              )}
            </div>
          </dl>

          <form
            onSubmit={handleStripeDonate}
            className="mt-5 rounded-[28px] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-gray-100 md:p-8"
          >
            {donationResult === 'success' && (
              <p className="mb-5 rounded-2xl bg-cyan-50 px-4 py-3 text-sm text-cyan-800">Thank you. Your gift is with Stripe.</p>
            )}
            {donationResult === 'cancelled' && (
              <p className="mb-5 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">The payment was not completed.</p>
            )}

            <p className="text-sm font-semibold text-gray-900">How often</p>
            <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1 sm:grid-cols-4">
              {frequencies.map(([value, label]) => {
                const selected = selectedFrequency === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => chooseFrequency(value)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      selected ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <p className="mt-7 text-sm font-semibold text-gray-900">Amount</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AMOUNT_PRESETS.map((amount) => {
                const selected = Number(amountInput) === amount;
                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setAmountInput(String(amount))}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selected
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-700 ring-1 ring-gray-200 hover:ring-cyan-300'
                    }`}
                  >
                    £{amount}
                  </button>
                );
              })}
            </div>
            <label className="mt-4 flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-200 focus-within:ring-cyan-400">
              <span className="text-lg text-gray-400">£</span>
              <input
                aria-label="Donation amount in pounds"
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value.replace(/[^0-9.]/g, ''))}
                className="min-w-0 flex-1 bg-transparent text-3xl font-semibold tracking-tight text-gray-900 outline-none"
              />
            </label>

            <div className="mt-6 space-y-3 text-sm text-gray-700">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={coverFee}
                  onChange={(event) => setCoverFee(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-cyan-600"
                />
                <span>Add the card fee, so the masjid receives the amount above.</span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={emailOptIn}
                  onChange={(event) => setEmailOptIn(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-cyan-600"
                />
                <span>Email me updates from Markaz Al-Rahma.</span>
              </label>
              {emailOptIn && (
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="Email address"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-cyan-400"
                />
              )}
            </div>

            {donateError && <p className="mt-4 text-sm text-red-600">{donateError}</p>}

            <button
              type="submit"
              disabled={submitting || !Number.isFinite(chargeAmount) || chargeAmount <= 0}
              className="mt-6 w-full rounded-full bg-cyan-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:opacity-60"
            >
              {submitting ? 'Opening Stripe…' : `Pay ${formatExact(coverFee ? chargeAmount : netAmount)} ${amountFrequency === 'once' ? 'once' : chargeWhen(amountFrequency)}`}
            </button>
          </form>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setShowBank((open) => !open)}
              className="rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-100 transition hover:ring-cyan-200"
            >
              <Landmark className="h-5 w-5 text-cyan-700" />
              <span className="mt-3 block text-sm font-semibold text-gray-900">{showBank ? 'Hide bank details' : 'Bank transfer'}</span>
            </button>
            <button
              type="button"
              onClick={handlePayPal}
              className="rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-100 transition hover:ring-cyan-200"
            >
              <Wallet className="h-5 w-5 text-cyan-700" />
              <span className="mt-3 block text-sm font-semibold text-gray-900">PayPal</span>
            </button>
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <MapPin className="h-5 w-5 text-cyan-700" />
              <span className="mt-3 block text-sm font-semibold text-gray-900">Cash at the centre</span>
            </div>
          </div>
          {showBank && (
            <div className="mt-3 rounded-3xl bg-white px-5 py-4 text-sm text-gray-700 shadow-sm ring-1 ring-gray-100">
              <p className="font-semibold text-gray-900">{donationInfo.bankTransfer.accountName}</p>
              <p className="mt-1">Sort code {donationInfo.bankTransfer.sortCode}</p>
              <p>Account {donationInfo.bankTransfer.accountNumber}</p>
            </div>
          )}
          <p className="mt-3 px-1 text-sm text-gray-500">Cash can be handed in at {mosqueInfo.location.address}.</p>

          <section className="mt-10 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8">
            <h2 className="text-lg font-semibold text-gray-900">Recent card gifts</h2>
            {recentGifts.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Gifts made on this page will be listed here.</p>
            ) : (
              <ul className="mt-4 flex flex-wrap gap-2">
                {recentGifts.map((gift, index) => (
                  <li
                    key={`${gift.name || gift.initials}-${gift.ago}-${index}`}
                    className="rounded-full bg-cyan-50 px-4 py-2 text-sm text-cyan-900"
                  >
                    <span className="font-medium">{gift.name || gift.initials || 'Gift'}</span>
                    <span className="mx-2 text-cyan-300">·</span>
                    {formatExact(gift.amount || 0)}
                    <span className="ml-2 text-cyan-700/70">{gift.ago}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-4 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-cyan-100 md:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">{maintenanceTracker.storyTitle}</h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">{maintenanceTracker.storyBody}</p>
            <p className="mt-3 text-base leading-relaxed text-gray-600">{maintenanceTracker.appeal}</p>
          </section>

          <section className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-gray-100">
            {pageLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-cyan-50 ${
                  index > 0 ? 'border-t border-gray-100' : ''
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{link.label}</span>
                  <span className="mt-0.5 block text-sm text-gray-500">{link.note}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-cyan-700" />
              </a>
            ))}
          </section>

          <section className="mt-4 rounded-[28px] bg-gray-900 p-6 text-white md:p-8">
            <p className="text-lg leading-relaxed text-gray-100">“{maintenanceTracker.quote}”</p>
            <p className="mt-3 text-sm text-gray-400">{maintenanceTracker.quoteCitation}</p>
            <p className="mt-4 text-sm text-gray-300">{maintenanceTracker.reward}</p>
            <button
              type="button"
              onClick={handleCopyLink}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </section>

          <section className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-gray-100">
            {profileLinks.map((link, index) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-4 px-6 py-4 transition hover:bg-cyan-50 ${
                  index > 0 ? 'border-t border-gray-100' : ''
                }`}
              >
                <ProfileIcon id={link.id} />
                <span className="text-sm font-semibold text-gray-900">{link.label}</span>
              </a>
            ))}
          </section>
        </div>
      </main>
      <Footer mosqueInfo={mosqueInfo} />
    </div>
  );
};

export default Maintenance;
