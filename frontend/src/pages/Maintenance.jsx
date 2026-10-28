import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Banknote, Calendar, Check, Copy, MapPin, Play, Quote } from 'lucide-react';
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

const formatTick = (amount) => {
  if (amount === 0) return '£0';
  if (amount >= 1000) {
    const thousands = amount / 1000;
    const label = Number.isInteger(thousands)
      ? String(thousands)
      : thousands.toFixed(1).replace(/\.0$/, '');
    return `£${label}k`;
  }
  return formatPounds(amount);
};

const percentOf = (current, total) => {
  if (!total) return 0;
  return Math.min(100, Math.max(0, (current / total) * 100));
};

const shareTargets = (url, text) => [
  {
    id: 'facebook',
    label: 'Share on Facebook',
    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'x',
    label: 'Share on X',
    href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: 'whatsapp',
    label: 'Share on WhatsApp',
    href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
];

const ShareIcon = ({ id }) => {
  if (id === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
        <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z" />
      </svg>
    );
  }
  if (id === 'x') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
        <path d="M14.7 10.3 22 2h-2.2l-6.3 7.2L8.2 2H2l7.7 11.1L2 22h2.2l6.8-7.8L15.6 22H22l-7.3-11.7zm-2.4 2.8-.8-1.1L5 3.6h2.7l5 7.1.8 1.1 6.5 9.2h-2.7l-5.3-7.6z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.16h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 13.87c-.24.68-1.4 1.3-1.94 1.34-.5.04-1.12.06-1.81-.11-.41-.1-.95-.31-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.24-.27.64-.4 1.02-.4.13 0 .24 0 .35.01.31.01.47-.04.73.56.27.64.92 2.22.1 2.37.1.18.16.3.03.48-.12.19-.19.31-.37.5l-.26.27c-.12.12-.24.25-.1.48.13.23.6.98 1.28 1.59.88.78 1.62 1.02 1.86 1.14.24.11.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.18 1.26z" />
    </svg>
  );
};

const supporterLine = (tier) => {
  if (tier.joined == null) return 'Loading the live supporter total.';
  const remaining = Math.max(0, tier.target - tier.joined);
  if (remaining === 0) return 'This supporter goal has been reached.';
  if (tier.id === 'weekly') {
    return `${remaining} spots left for brothers and sisters giving £5 a week.`;
  }
  return `${remaining} more brothers and sisters are needed to reach ${tier.target} daily supporters.`;
};

const exploreCards = [
  {
    id: 'timetable',
    eyebrow: 'Prayer timetable',
    title: 'Plan your day around the masjid',
    body: 'See the latest salah and iqamah times, and keep the monthly timetable to hand.',
    href: '/timetable',
    link: 'View the timetable',
    icon: Calendar,
  },
  {
    id: 'recordings',
    eyebrow: 'Knowledge',
    title: 'A place to learn',
    body: 'Watch recorded lectures and programmes from Markaz Al-Rahma, and keep learning through the week.',
    href: '/youtube-recordings',
    link: 'Watch recordings',
    icon: Play,
  },
  {
    id: 'events',
    eyebrow: 'Community',
    title: 'What is happening at the masjid',
    body: 'Classes, lectures, and community programmes at Markaz Al-Rahma. See what is coming up and who is teaching.',
    href: '/events',
    link: 'View events',
    icon: MapPin,
  },
];

const Maintenance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [giveMode, setGiveMode] = useState('often');
  const [cadence, setCadence] = useState('month');
  const [amountInput, setAmountInput] = useState('50');
  const [plan, setPlan] = useState('daily');
  const [coverFee, setCoverFee] = useState(true);
  const [email, setEmail] = useState('');
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitTarget, setSubmitTarget] = useState('');
  const [donateError, setDonateError] = useState('');
  const [showBank, setShowBank] = useState(false);
  const [recentGifts, setRecentGifts] = useState([]);
  const [raised, setRaised] = useState(0);
  const [dailyJoined, setDailyJoined] = useState(null);
  const [weeklyJoined, setWeeklyJoined] = useState(null);
  const [totalLive, setTotalLive] = useState(false);
  const [totalStatus, setTotalStatus] = useState('loading');
  const donationResult = searchParams.get('donation');
  const { goal } = maintenanceTracker;
  const supporters = maintenanceTracker.supporters.map((tier) => ({
    ...tier,
    joined: tier.id === 'daily' ? dailyJoined : weeklyJoined,
  }));
  const raisedPercent = percentOf(raised, goal);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((step) => Math.round(goal * step));

  const handlePayPal = () => {
    window.open(PAYPAL_URL, '_blank', 'noopener,noreferrer');
  };

  const netAmount = Number(amountInput);
  const chargeAmount = Number.isFinite(netAmount) ? cardCharge(netAmount, coverFee) : 0;
  const planAmount = plan === 'weekly' ? 5 : 1;
  const planFrequency = plan === 'weekly' ? 'week' : 'day';
  const planCharge = cardCharge(planAmount, coverFee);
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
          setDailyJoined(typeof data.daily === 'number' ? data.daily : null);
          setWeeklyJoined(typeof data.weekly === 'number' ? data.weekly : null);
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

  return (
    <div className="min-h-screen bg-[#f7f6f3] flex flex-col">
      <Header mosqueInfo={mosqueInfo} />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-5 md:py-14 max-w-6xl">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-4 md:mb-8 text-gray-700 hover:text-cyan-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-10 items-start">
            <section className="order-2 min-w-0 lg:order-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight max-w-xl">
                Help keep{' '}
                <span className="text-cyan-600 whitespace-nowrap">Markaz Al-Rahma</span>{' '}
                running.
              </h1>
              <p className="mt-4 text-gray-600 text-base sm:text-lg max-w-xl">
                {maintenanceTracker.intro}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-8">
                {supporters.map((tier) => {
                  const tierPercent = percentOf(tier.joined, tier.target);
                  return (
                    <article
                      key={tier.id}
                      className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                    >
                      <p className="text-sm text-gray-600">{tier.title}</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight">
                        <span className="text-cyan-600">{tier.joined == null ? '—' : tier.joined}</span>
                        <span className="text-gray-400 font-medium"> of {tier.target}</span>
                      </p>
                      <div
                        className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={tier.joined || 0}
                        aria-valuemin={0}
                        aria-valuemax={tier.target}
                        aria-label={tier.title}
                      >
                        <div
                          className="h-full bg-cyan-600 rounded-full"
                          style={{ width: `${tierPercent}%` }}
                        />
                      </div>
                      <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                        {supporterLine(tier)}
                      </p>
                    </article>
                  );
                })}
              </div>

              <article className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                  <p className="text-xs font-semibold tracking-[0.14em] text-gray-500 uppercase">
                    Raised this month
                  </p>
                  <p className="text-lg sm:text-right sm:text-2xl font-semibold text-cyan-600">
                    {formatPounds(raised)}
                    <span className="text-gray-500 font-medium text-base sm:text-lg">
                      {' '}of {formatPounds(goal)} goal
                    </span>
                  </p>
                </div>
                <div
                  className="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(raised)}
                  aria-valuemin={0}
                  aria-valuemax={goal}
                  aria-label="Raised this month"
                >
                  <div
                    className="h-full bg-cyan-600 rounded-full"
                    style={{ width: `${raisedPercent}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-400">
                  {ticks.map((tick) => (
                    <span key={tick}>{formatTick(tick)}</span>
                  ))}
                </div>
                <p className="mt-4 text-sm text-gray-600">{maintenanceTracker.footnote}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {totalLive
                    ? 'This is the live card total for this month.'
                    : totalStatus === 'error'
                      ? 'The card total could not be loaded.'
                      : totalStatus === 'loading'
                        ? 'Loading the live card total.'
                        : 'The live card total is not available yet.'}
                </p>
              </article>

              <div className="mt-8">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-900">Recent contributions</h2>
                  <span className="h-2 w-2 rounded-full bg-cyan-500" aria-hidden="true" />
                </div>
                {recentGifts.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">Gifts made on this page will appear here.</p>
                ) : (
                  <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {recentGifts.map((gift, index) => (
                      <li
                        key={`${gift.name || gift.initials}-${gift.ago}-${index}`}
                        className="min-w-[7.5rem] rounded-2xl border border-gray-200 bg-white px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400">
                          <span className="font-semibold text-gray-700 whitespace-nowrap">{gift.name || gift.initials || 'Gift'}</span>
                          <span>{gift.ago}</span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{formatExact(gift.amount || 0)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <article className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
                <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
                  <Quote className="h-5 w-5" />
                </div>
                <p className="text-gray-800 text-base sm:text-lg leading-relaxed">
                  The Prophet ﷺ said: “{maintenanceTracker.quote}”
                </p>
                <p className="mt-3 text-sm text-cyan-700 font-medium">
                  {maintenanceTracker.quoteCitation}
                </p>
                <p className="mt-5 text-sm text-gray-600 leading-relaxed">
                  {maintenanceTracker.appeal}
                </p>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  {maintenanceTracker.reward}
                </p>
                <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-sm font-medium text-gray-800">Spread the word!</p>
                  <div className="flex items-center gap-2">
                    {shareTargets(window.location.href, maintenanceTracker.shareText).map((item) => (
                      <a
                        key={item.id}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={item.label}
                        className="h-9 w-9 rounded-full border border-gray-200 text-gray-600 hover:text-cyan-700 hover:border-cyan-300 inline-flex items-center justify-center"
                      >
                        <ShareIcon id={item.id} />
                      </a>
                    ))}
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      aria-label={copied ? 'Link copied' : 'Copy link'}
                      className="h-9 w-9 rounded-full border border-gray-200 text-gray-600 hover:text-cyan-700 hover:border-cyan-300 inline-flex items-center justify-center"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </article>
            </section>

            <aside className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
              <div className="bg-white border border-cyan-100 rounded-2xl shadow-sm p-5 sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 text-center">
                  Monthly Masjid Maintenance
                </h2>
                <div className="mx-auto mt-2 h-0.5 w-12 bg-cyan-600" />
                <p className="mt-4 text-sm text-gray-600 text-center leading-relaxed">
                  Donations this month help cover the costs of keeping Markaz Al-Rahma open.
                </p>
                <div className="mt-4">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-gray-500">This month</span>
                    <span className="font-semibold text-cyan-700">
                      {formatPounds(raised)}
                      <span className="font-medium text-gray-500"> of {formatPounds(goal)}</span>
                    </span>
                  </div>
                  <div
                    className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(raised)}
                    aria-valuemin={0}
                    aria-valuemax={goal}
                    aria-label="Raised toward the monthly goal"
                  >
                    <div
                      className="h-full bg-cyan-600 rounded-full"
                      style={{ width: `${raisedPercent}%` }}
                    />
                  </div>
                </div>
                {donationResult === 'success' && (
                  <p className="mt-4 rounded-xl bg-cyan-50 border border-cyan-100 px-3 py-2 text-sm text-cyan-800 text-center">
                    Thank you. Your gift is with Stripe.
                  </p>
                )}
                {donationResult === 'cancelled' && (
                  <p className="mt-4 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-600 text-center">
                    The payment was not completed.
                  </p>
                )}
                <form onSubmit={handleStripeDonate} className="mt-5">
                  <div className="grid grid-cols-2 rounded-full bg-gray-100 p-1">
                    {[
                      ['once', 'Give once'],
                      ['often', 'Give often'],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setGiveMode(value)}
                        className={`min-h-11 rounded-full text-sm font-semibold ${
                          giveMode === value
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {giveMode === 'often' && (
                    <div className="mt-3 grid grid-cols-3 gap-1">
                      {[
                        ['day', 'Daily'],
                        ['week', 'Weekly'],
                        ['month', 'Monthly'],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setCadence(value)}
                          className={`min-h-11 rounded-xl text-sm font-semibold ${
                            cadence === value ? 'bg-gray-900 text-white' : 'text-gray-500'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {AMOUNT_PRESETS.map((amount) => {
                      const selected = Number(amountInput) === amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setAmountInput(String(amount))}
                          className={`min-h-14 rounded-xl border text-sm font-semibold ${
                            selected
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                              : 'border-gray-200 text-gray-800'
                          }`}
                        >
                          £{amount}
                          {amount === 50 && (
                            <span className="mt-0.5 block text-[10px] font-semibold tracking-wide text-cyan-600">
                              Suggested
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <label className="mt-3 flex items-center rounded-2xl border border-gray-200 px-4 min-h-[4.5rem]">
                    <span className="pr-4 border-r border-gray-200 text-gray-500">
                      <span className="block text-lg leading-none text-gray-800">£</span>
                      <span className="mt-1 block text-[10px] tracking-wide">GBP</span>
                    </span>
                    <input
                      aria-label="Donation amount in pounds"
                      type="text"
                      inputMode="decimal"
                      value={amountInput}
                      onChange={(event) => setAmountInput(event.target.value.replace(/[^0-9.]/g, ''))}
                      className="min-w-0 flex-1 bg-transparent text-right text-4xl font-semibold text-gray-900 outline-none"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={submitting || !Number.isFinite(chargeAmount) || chargeAmount <= 0}
                    className="mt-3 w-full min-h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white font-semibold leading-tight"
                  >
                    {submitting && submitTarget === 'amount' ? 'Opening Stripe…' : (
                      <>
                        <span className="block">Donate for Allah's Sake Now</span>
                        <span className="block text-sm font-medium text-cyan-50">
                          {formatExact(coverFee ? chargeAmount : netAmount)}{' '}
                          {amountFrequency === 'once' ? 'once' : chargeWhen(amountFrequency)}
                        </span>
                      </>
                    )}
                  </button>
                  <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                    {supporters.map((tier) => {
                      const selected = plan === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setPlan(tier.id)}
                          className={`rounded-xl border p-3 text-left ${
                            selected ? 'border-cyan-400 bg-cyan-50' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <span
                            className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                              selected ? 'border-cyan-600' : 'border-gray-300'
                            }`}
                            aria-hidden="true"
                          >
                            {selected && <span className="h-2 w-2 rounded-full bg-cyan-600" />}
                          </span>
                          <span className="mt-2 block text-sm font-semibold text-gray-900">
                            {tier.id === 'daily' ? '£1' : '£5'}
                            <span className="font-medium text-gray-500">
                              {tier.id === 'daily' ? ' / day' : ' / week'}
                            </span>
                          </span>
                          <span className="mt-1 block text-sm font-semibold text-gray-900 leading-snug">
                            {tier.id === 'daily'
                              ? `Be one of ${tier.target} daily supporters`
                              : 'Give on a Friday'}
                          </span>
                          <span className="mt-1 block text-xs text-gray-600 leading-relaxed">
                            {tier.id === 'daily'
                              ? 'Less than the price of a takeaway coffee. Helps keep the masjid open every day.'
                              : 'One small gift each week from brothers and sisters who give on a Friday.'}
                          </span>
                          {tier.joined != null && (
                            <span className="mt-2 inline-flex rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-cyan-800">
                              {tier.joined} / {tier.target} joined
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 space-y-3">
                    <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-3 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={coverFee}
                        onChange={(event) => setCoverFee(event.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-cyan-600"
                      />
                      <span className="min-w-0 text-gray-700 leading-snug">
                        I’d like to cover the transaction fee so the full gift reaches the masjid. Each button shows the card charge for that gift.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 px-1 py-1 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={emailOptIn}
                        onChange={(event) => setEmailOptIn(event.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-cyan-600"
                      />
                      <span>Yes, keep me updated on Markaz Al-Rahma by email.</span>
                    </label>
                  </div>
                  {emailOptIn && (
                    <label className="mt-3 block text-sm text-gray-600">
                      Email
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        className="mt-1 w-full min-h-11 rounded-xl border border-gray-200 px-3 text-gray-900"
                      />
                    </label>
                  )}
                  {donateError && (
                    <p className="mt-3 text-sm text-red-600">{donateError}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => startCheckout(planAmount, planFrequency, 'plan')}
                    disabled={submitting}
                    className="mt-4 w-full min-h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white font-semibold inline-flex items-center justify-center gap-2"
                  >
                    {submitting && submitTarget === 'plan'
                      ? 'Opening Stripe…'
                      : plan === 'weekly'
                        ? `Give £5 / week${coverFee ? ` · ${formatExact(planCharge)}` : ''}`
                        : `Give £1 / day${coverFee ? ` · ${formatExact(planCharge)}` : ''}`}
                    {!(submitting && submitTarget === 'plan') && <ArrowRight className="h-4 w-4" />}
                  </button>
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-gray-500 uppercase text-center">
                      Other ways to donate
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBank((open) => !open)}
                        className="min-h-16 rounded-xl border border-gray-200 px-2 text-center"
                      >
                        <Banknote className="h-5 w-5 mx-auto text-gray-700" />
                        <span className="mt-1 block text-[11px] font-semibold text-gray-800">Bank transfer</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePayPal}
                        className="min-h-16 rounded-xl border border-gray-200 px-2 text-center"
                      >
                        <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#003087] text-[10px] font-bold text-white">P</span>
                        <span className="mt-1 block text-[11px] font-semibold text-gray-800">PayPal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBank(false)}
                        className="min-h-16 rounded-xl border border-gray-200 px-2 text-center"
                      >
                        <MapPin className="h-5 w-5 mx-auto text-gray-700" />
                        <span className="mt-1 block text-[11px] font-semibold text-gray-800">Cash</span>
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-gray-500 text-center leading-relaxed">
                      Cash can be given in person at {mosqueInfo.location.address}.
                    </p>
                    {showBank && (
                      <div className="mt-3 space-y-2 text-sm">
                        <div>
                          <div className="text-gray-500">Account name</div>
                          <div className="font-semibold text-gray-900">{donationInfo.bankTransfer.accountName}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-gray-500">Sort code</div>
                            <div className="font-mono font-semibold text-gray-900">{donationInfo.bankTransfer.sortCode}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Account number</div>
                            <div className="font-mono font-semibold text-gray-900">{donationInfo.bankTransfer.accountNumber}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </aside>
          </div>

          <section id="our-masjid" className="mt-14">
            <div className="bg-cyan-700 text-white rounded-2xl px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Our Masjid</h2>
                <p className="text-cyan-50 text-sm mt-1">
                  A place of prayer, knowledge and community in Colindale.
                </p>
              </div>
              <a
                href="/#about"
                className="inline-flex items-center justify-center gap-1 rounded-full border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white/10 whitespace-nowrap"
              >
                About the masjid
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-4 grid lg:grid-cols-2 gap-4">
              <div className="bg-black rounded-2xl overflow-hidden min-h-[240px]">
                <iframe
                  className="w-full aspect-video"
                  src={`https://www.youtube.com/embed/${maintenanceTracker.appealVideoId}`}
                  title="Markaz Al-Rahma appeal"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <article className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
                <p className="text-xs font-semibold tracking-[0.14em] text-cyan-700 uppercase">
                  A place for prayer, knowledge and community
                </p>
                <h3 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {maintenanceTracker.storyTitle}
                </h3>
                <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                  {maintenanceTracker.storyBody}
                </p>
                <a href="/#about" className="inline-flex items-center gap-1 mt-5 text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                  Read about us
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <blockquote className="mt-6 border-l-2 border-cyan-200 pl-4">
                  <p className="text-sm text-gray-700 leading-relaxed">“{maintenanceTracker.quote}”</p>
                  <p className="mt-2 text-xs text-cyan-700 font-medium">{maintenanceTracker.quoteCitation}</p>
                </blockquote>
              </article>
            </div>
          </section>

          <section id="more" className="mt-8 mb-4">
            <div className="bg-cyan-700 text-white rounded-2xl px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">More than a building</h2>
                <p className="text-cyan-50 text-sm mt-1">
                  Salah, lessons, and programmes that the monthly running costs keep open.
                </p>
              </div>
              <a
                href="/timetable"
                className="inline-flex items-center justify-center gap-1 rounded-full border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white/10 whitespace-nowrap"
              >
                View timetable
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-4 grid md:grid-cols-3 gap-4">
              {exploreCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    <div className="h-28 bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center">
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <p className="text-xs font-semibold tracking-[0.14em] text-cyan-700 uppercase">
                        {card.eyebrow}
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-gray-900">{card.title}</h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed flex-1">{card.body}</p>
                      <a href={card.href} className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                        {card.link}
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <Footer mosqueInfo={mosqueInfo} />
    </div>
  );
};

export default Maintenance;
