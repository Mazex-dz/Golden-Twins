import { useEffect, useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  MapPin,
  Clock,
  Camera,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  Sparkles,
  Check,
  MessageCircle,
  Globe,
  ArrowUpRight,
  ArrowUpLeft,
  Flame,
  Phone,
  Truck,
  Copy,
} from 'lucide-react';
import { BRAND, TRANSLATIONS } from './data/content';

const SPRING_UI = { type: 'spring', stiffness: 420, damping: 34 };
const SPRING_DRAWER = { type: 'spring', stiffness: 360, damping: 36 };

/* 4-point golden star matching the Golden Twins logo */
function GoldStar({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 1L14.8 9.2L23 12L14.8 14.8L12 23L9.2 14.8L1 12L9.2 9.2L12 1Z" />
    </svg>
  );
}

export default function App() {
  const [lang, setLang] = useState('fr');
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const [activeCategory, setActiveCategory] = useState('moelleuse');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [igModalOpen, setIgModalOpen] = useState(false);

  // Customizer state
  const [selectedBase, setSelectedBase] = useState('crepe-m');
  const [selectedSauce, setSelectedSauce] = useState('mordjene');
  const [selectedToppings, setSelectedToppings] = useState(['moukassirat']);

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1, itemSupplements: item.itemSupplements || [] }];
    });
    toast.success(item.name, {
      description: lang === 'fr' ? 'Ajouté à votre panier' : 'تمت الإضافة إلى السلة',
      action: {
        label: lang === 'fr' ? 'Voir' : 'عرض',
        onClick: () => setIsCartOpen(true),
      },
    });
  };

  const toggleItemSupplement = (cartItemId, sup) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartItemId) return item;
        const current = item.itemSupplements || [];
        const exists = current.some((s) => s.id === sup.id);
        const nextSups = exists
          ? current.filter((s) => s.id !== sup.id)
          : [...current, { id: sup.id, name: sup.name, price: sup.price }];
        return { ...item, itemSupplements: nextSups };
      })
    );
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const getItemUnitPrice = (item) => {
    const base = item.price || 0;
    const supsTotal = (item.itemSupplements || []).reduce((s, sup) => s + sup.price, 0);
    return base + supsTotal;
  };

  const getItemQty = (id) => cart.find((i) => i.id === id)?.qty || 0;

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart]);
  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, i) => {
        const base = i.price || 0;
        const sups = (i.itemSupplements || []).reduce((s, sup) => s + sup.price, 0);
        return sum + (base + sups) * i.qty;
      }, 0),
    [cart]
  );

  const filteredMenu = useMemo(() => {
    return t.menu.items.filter((item) => item.category === activeCategory);
  }, [activeCategory, t.menu.items]);

  const spotlightItem = filteredMenu[0];
  const restMenuItems = filteredMenu.slice(1);

  // Customizer calculations
  const baseObj = t.customizer.bases.find((b) => b.id === selectedBase) || t.customizer.bases[0];
  const sauceObj = t.customizer.sauces.find((s) => s.id === selectedSauce) || t.customizer.sauces[0];
  const toppingObjs = t.customizer.toppings.filter((tp) => selectedToppings.includes(tp.id));
  const customPrice =
    baseObj.price + sauceObj.price + toppingObjs.reduce((sum, tp) => sum + tp.price, 0);

  const toggleTopping = (id) => {
    setSelectedToppings((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleAddCustom = () => {
    const toppingsLabel = toppingObjs.map((x) => x.name).join(', ');
    const customName = `${baseObj.name} + ${sauceObj.name}${toppingsLabel ? ` (${toppingsLabel})` : ''}`;
    addToCart({
      id: `custom-${selectedBase}-${selectedSauce}-${[...selectedToppings].sort().join('-')}`,
      name: customName,
      price: customPrice,
      image: baseObj.image,
    });
  };

  const buildOrderMessage = () => {
    const lines = cart.map((i) => {
      const sups = i.itemSupplements || [];
      const unitTotal = getItemUnitPrice(i);
      const priceText =
        i.price !== null && i.price !== undefined
          ? `${unitTotal * i.qty} ${t.menu.currency}`
          : `(${t.menu.priceOnSite})`;
      const supLine =
        sups.length > 0
          ? `\n   ↳ + Supplément : ${sups.map((s) => `${s.name} (+${s.price} ${t.menu.currency})`).join(', ')}`
          : '';
      return `• ${i.qty}x ${i.name} — ${priceText}${supLine}`;
    });

    const header =
      lang === 'fr'
        ? `🌟 COMMANDE GOLDEN TWINS (Bordj Menaïel) :`
        : `🌟 طلب جديد GOLDEN TWINS (برج منايل) :`;
    const footer =
      lang === 'fr'
        ? `\n────────────────────\n💰 Total : ${cartTotal} DA${
            customerName ? `\n👤 Client : ${customerName}` : ''
          }${customerAddress ? `\n📍 Adresse : ${customerAddress}` : ''}${
            orderNote ? `\n📝 Note : ${orderNote}` : ''
          }`
        : `\n────────────────────\n💰 المجموع : ${cartTotal} دج${
            customerName ? `\n👤 الاسم والهاتف : ${customerName}` : ''
          }${customerAddress ? `\n📍 العنوان : ${customerAddress}` : ''}${
            orderNote ? `\n📝 ملاحظة : ${orderNote}` : ''
          }`;
    return `${header}\n────────────────────\n${lines.join('\n')}${footer}`;
  };

  const copyToClipboardReliable = async (msg) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(msg);
        return true;
      }
    } catch {
      // fallback below
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = msg;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  };

  const handleCopyOrder = async () => {
    if (cart.length === 0) return;
    const msg = buildOrderMessage();
    await copyToClipboardReliable(msg);
    toast.success(t.cart.copiedToast);
  };

  const handleInstagramOrder = async () => {
    if (cart.length === 0) return;
    const msg = buildOrderMessage();
    await copyToClipboardReliable(msg);
    setIgModalOpen(true);
  };

  const handleConfirmOpenInstagram = async () => {
    const msg = buildOrderMessage();
    await copyToClipboardReliable(msg);
    const encoded = encodeURIComponent(msg);
    window.open(`https://ig.me/m/${BRAND.instagramHandle}?text=${encoded}`, '_blank');
    setIgModalOpen(false);
  };

  const handleWhatsAppOrder = () => {
    if (cart.length === 0) return;
    const text = encodeURIComponent(buildOrderMessage());
    window.open(`https://wa.me/${BRAND.whatsappNumber}?text=${text}`, '_blank');
  };

  const CornerArrow = isRtl ? ArrowUpLeft : ArrowUpRight;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-[#FFFDF8] text-[#240F01]">
        {/* Fixed subtle paper grain overlay */}
        <div className="film-grain pointer-events-none fixed inset-0 z-40 opacity-[0.022]" />

        {/* Sonner Toaster */}
        <Toaster
          position={isRtl ? 'bottom-left' : 'bottom-right'}
          toastOptions={{
            style: {
              background: '#3A1902',
              color: '#FFFDF8',
              border: '1px solid #E5A93C',
              borderRadius: '1rem',
            },
          }}
        />

        {/* Fluid Island Floating Navbar with Prominent Logo Crest */}
        <header className="fixed inset-x-0 top-3 z-30 mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between rounded-full border-2 border-[#E5A93C]/50 bg-[#FFFDF8]/92 px-3.5 py-2 shadow-[0_12px_36px_rgba(58,25,2,0.12)] backdrop-blur-xl sm:px-5">
            <a href="#" className="group flex items-center gap-3.5">
              <div className="relative -my-1.5">
                <img
                  src="/images/logo.jpg"
                  alt={BRAND.name}
                  className="logo-medallion h-14 w-14 rounded-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-16"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-lg font-bold tracking-tight text-[#3A1902] sm:text-xl">
                    {BRAND.name}
                  </span>
                  <GoldStar className="h-3.5 w-3.5 text-[#E5A93C]" />
                </div>
                <span className="block text-[11px] font-semibold tracking-wide text-[#9A5B13]">
                  {isRtl ? 'برج منايل • بومرداس' : 'Bordj Mnaiel • Boumerdès'}
                </span>
              </div>
            </a>

            <nav className="hidden items-center gap-7 text-xs font-bold tracking-wide text-[#3A1902] md:flex">
              <a href="#signatures" className="transition-colors hover:text-[#B57316]">
                {t.nav.story}
              </a>
              <a href="#menu" className="transition-colors hover:text-[#B57316]">
                {t.nav.menu}
              </a>
              <a href="#customizer" className="transition-colors hover:text-[#B57316]">
                {t.nav.customizer}
              </a>
              <a href="#visit" className="transition-colors hover:text-[#B57316]">
                {t.nav.visit}
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang((prev) => (prev === 'fr' ? 'ar' : 'fr'))}
                className="btn-tactile flex items-center gap-1.5 rounded-full border border-[#E5A93C]/50 bg-[#F5E9D6]/60 px-3.5 py-2 text-xs font-bold text-[#3A1902] hover:border-[#E5A93C] hover:bg-[#F5E9D6]"
                aria-label="Switch language"
              >
                <Globe className="h-3.5 w-3.5 text-[#B57316]" strokeWidth={1.6} />
                <span>{lang === 'fr' ? 'العربية' : 'FR'}</span>
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="btn-tactile relative flex items-center gap-2 rounded-full bg-[#3A1902] px-4 py-2.5 text-xs font-bold text-[#FFFDF8] shadow-[0_6px_18px_rgba(58,25,2,0.25)] ring-1 ring-[#E5A93C]/50 hover:bg-[#4F2304]"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-[#FCE092]" strokeWidth={1.6} />
                <span className="hidden sm:inline">{t.nav.order}</span>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.7 }}
                    animate={{ scale: 1 }}
                    transition={SPRING_UI}
                    className="tabular-nums flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-b from-[#FCE092] to-[#E5A93C] px-1 text-[10px] font-extrabold text-[#240F01]"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </button>

              <button
                onClick={() => setMobileNavOpen((prev) => !prev)}
                className="relative flex h-9 w-9 flex-col items-center justify-center rounded-full border border-[#E5A93C]/50 bg-[#F5E9D6]/60 md:hidden"
                aria-label="Toggle menu"
              >
                <span
                  className={`absolute h-0.5 w-4 rounded-full bg-[#3A1902] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    mobileNavOpen ? 'rotate-45' : '-translate-y-1'
                  }`}
                />
                <span
                  className={`absolute h-0.5 w-4 rounded-full bg-[#3A1902] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    mobileNavOpen ? '-rotate-45' : 'translate-y-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileNavOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="mt-2 rounded-3xl border-2 border-[#E5A93C]/50 bg-[#FFFDF8]/98 p-5 shadow-xl backdrop-blur-xl md:hidden"
              >
                <div className="flex flex-col gap-3 text-sm font-bold text-[#3A1902]">
                  <a href="#signatures" onClick={() => setMobileNavOpen(false)} className="py-1">
                    {t.nav.story}
                  </a>
                  <a href="#menu" onClick={() => setMobileNavOpen(false)} className="py-1">
                    {t.nav.menu}
                  </a>
                  <a href="#customizer" onClick={() => setMobileNavOpen(false)} className="py-1">
                    {t.nav.customizer}
                  </a>
                  <a href="#visit" onClick={() => setMobileNavOpen(false)} className="py-1">
                    {t.nav.visit}
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main>
          {/* Editorial Split Hero with Prominent Golden Twins Crest & Logo Colors */}
          <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF8] via-[#FAF2E3] to-[#F5E9D6] pt-32 pb-20 sm:pt-40 sm:pb-28">
            {/* Warm Golden Crêpe Halo matching logo */}
            <div className="pointer-events-none absolute -top-24 right-0 h-[560px] w-[560px] rounded-full bg-[#E5A93C]/22 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-[380px] w-[380px] rounded-full bg-[#3A1902]/6 blur-3xl" />

            <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12">
              {/* Left Editorial Copy + Organized Hero Emblem Header */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
                className="lg:col-span-6"
              >
                {/* Organized Brand Crest Header */}
                <div className="mb-7 flex items-center gap-4 rounded-3xl border border-[#E5A93C]/45 bg-[#FFFDF8]/90 p-3 shadow-[0_10px_28px_rgba(58,25,2,0.08)] sm:inline-flex sm:pe-6">
                  <img
                    src="/images/logo.jpg"
                    alt="Logo Golden Twins"
                    className="logo-medallion h-20 w-20 shrink-0 rounded-full object-cover sm:h-24 sm:w-24"
                  />
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#3A1902] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#FCE092]">
                      <GoldStar className="h-3 w-3 text-[#E5A93C]" />
                      <span>{isRtl ? 'جولدن توينز • كريب' : 'Golden Twins • Crêpes'}</span>
                    </div>
                    <p className="font-display mt-1.5 text-lg font-bold text-[#3A1902] sm:text-xl">
                      {isRtl ? 'الأصل في برج منايل' : 'L’Original à Bordj Mnaiel'}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#7A4918]">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{t.hero.openBadge}</span>
                    </div>
                  </div>
                </div>

                <h1 className="font-display text-4xl font-bold leading-[1.04] tracking-tight text-[#3A1902] sm:text-6xl lg:text-[4.1rem]">
                  {t.hero.titleLine1}{' '}
                  <span className="bg-gradient-to-r from-[#B57316] via-[#E5A93C] to-[#9A5B13] bg-clip-text italic text-transparent">
                    {t.hero.titleHighlight}
                  </span>{' '}
                  {t.hero.titleLine2}
                </h1>

                <p className="mt-6 max-w-lg text-base leading-relaxed text-[#573114] sm:text-lg">
                  {t.hero.subtitle}
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <a
                    href="#menu"
                    className="btn-tactile group inline-flex items-center gap-3 rounded-full bg-[#3A1902] py-2 ps-6 pe-2 text-sm font-bold text-[#FFFDF8] shadow-[0_14px_32px_rgba(58,25,2,0.28)] ring-2 ring-[#E5A93C]/70"
                  >
                    <span>{t.hero.ctaMenu}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-[#FCE092] to-[#E5A93C] text-[#240F01] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <CornerArrow className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                  </a>

                  <a
                    href="#customizer"
                    className="btn-tactile inline-flex items-center gap-2 rounded-full border-2 border-[#E5A93C]/60 bg-[#FFFDF8] px-6 py-3.5 text-sm font-bold text-[#3A1902] hover:bg-[#F5E9D6]/60"
                  >
                    <Sparkles className="h-4 w-4 text-[#B57316]" strokeWidth={1.6} />
                    <span>{t.hero.ctaCustom}</span>
                  </a>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-bold text-[#3A1902]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5A93C]/25 px-3.5 py-1.5 text-[#3A1902] ring-1 ring-[#E5A93C]/60">
                    <Truck className="h-3.5 w-3.5 text-[#B57316]" strokeWidth={1.8} />
                    <span>{t.hero.openBadge}</span>
                  </span>
                  <a
                    href={`tel:${BRAND.phone1Raw}`}
                    className="btn-tactile inline-flex items-center gap-1.5 rounded-full border border-[#E5A93C]/60 bg-[#FFFDF8] px-3.5 py-1.5 hover:bg-[#FAF2E3]"
                  >
                    <Phone className="h-3.5 w-3.5 text-[#B57316]" strokeWidth={1.7} />
                    <span className="tabular-nums">{BRAND.phone1}</span>
                  </a>
                  <a
                    href={`tel:${BRAND.phone2Raw}`}
                    className="btn-tactile inline-flex items-center gap-1.5 rounded-full border border-[#E5A93C]/60 bg-[#FFFDF8] px-3.5 py-1.5 hover:bg-[#FAF2E3]"
                  >
                    <Phone className="h-3.5 w-3.5 text-[#B57316]" strokeWidth={1.7} />
                    <span className="tabular-nums">{BRAND.phone2}</span>
                  </a>
                </div>
              </motion.div>

              {/* Right Z-Axis Cascading Photo Stack + Floating Centerpiece Emblem */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.75, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
                className="relative lg:col-span-6"
              >
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Double-Bezel Hero Frame with Golden Ring */}
                  <div className="rounded-[2.25rem] bg-gradient-to-br from-[#FCE092] via-[#E5A93C] to-[#B57316] p-1.5 shadow-[0_24px_60px_rgba(58,25,2,0.22)]">
                    <div className="rounded-[calc(2.25rem-0.375rem)] bg-[#3A1902] p-1.5">
                      <div className="relative h-[380px] overflow-hidden rounded-[calc(2.25rem-0.75rem)] sm:h-[460px]">
                        <img
                          src="/images/hero-dessert.jpg"
                          alt="Golden Twins Crêpes & San Sebastián"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#240F01]/95 via-[#3A1902]/45 to-transparent p-6 text-[#FFFDF8]">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FCE092]">
                            <GoldStar className="h-3 w-3 text-[#E5A93C]" />
                            <span>{isRtl ? 'جولدن توينز' : 'Atelier Golden Twins'}</span>
                          </div>
                          <p className="font-display mt-1 text-xl font-bold text-[#FFFDF8]">
                            {isRtl
                              ? 'سان سيباستيان وكريب بالمرجان ونوتيلا'
                              : 'San Sebastián & Crêpes El Mordjene / Nutella'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Large Floating Logo Seal Badge on Top-Left of Hero Frame */}
                  <div className=" -top-8 -left-5 z-20 hidden sm:absolute sm:block">
                    <div className="relative rounded-full bg-[#FFFDF8] p-1.5">
                      <img
                        src="/images/logo.jpg"
                        alt="Golden Twins Emblem"
                        className="logo-medallion-lg h-28 w-28 rounded-full object-cover lg:h-32 lg:w-32"
                      />
                    </div>
                  </div>

                  {/* Floating Cascading Product Cards (Desktop) */}
                  <div className="hidden md:block">
                    <div className="absolute -bottom-6 -left-6 w-52 -rotate-2 rounded-3xl border-2 border-[#E5A93C]/50 bg-[#FFFDF8] p-2 shadow-[0_20px_44px_rgba(58,25,2,0.18)] transition-transform duration-500 hover:rotate-0">
                      <img
                        src="/images/san-sebastian.jpg"
                        alt="San Sebastián"
                        className="h-28 w-full rounded-2xl object-cover"
                      />
                      <div className="flex items-center justify-between px-1.5 pt-2.5 pb-1">
                        <span className="text-xs font-bold text-[#3A1902]">San Sebastián</span>
                        <span className="tabular-nums text-xs font-extrabold text-[#B57316]">
                          650 / 800 {t.menu.currency}
                        </span>
                      </div>
                    </div>

                    <div className="absolute -top-6 -right-6 w-52 rotate-2 rounded-3xl border-2 border-[#E5A93C]/50 bg-[#FFFDF8] p-2 shadow-[0_20px_44px_rgba(58,25,2,0.16)] transition-transform duration-500 hover:rotate-0">
                      <img
                        src="/images/bubble-waffle.jpg"
                        alt="Bubble Waffle"
                        className="h-24 w-full rounded-2xl object-cover"
                      />
                      <div className="flex items-center justify-between px-1.5 pt-2.5 pb-1">
                        <span className="text-xs font-bold text-[#3A1902]">Bubble / Gaufre</span>
                        <span className="tabular-nums text-xs font-extrabold text-[#B57316]">
                          600 / 750 {t.menu.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Marquee Ticker in Logo Ribbon Colors (#3A1902 & #FCE092 / #E5A93C) */}
          <div className="overflow-hidden border-y-2 border-[#E5A93C] bg-[#3A1902] py-3.5 text-[#FCE092]">
            <div className="animate-marquee flex items-center gap-8 text-[11px] font-extrabold uppercase tracking-[0.2em]">
              {[...t.marquee, ...t.marquee, ...t.marquee].map((item, idx) => (
                <span key={idx} className="flex items-center gap-8 whitespace-nowrap">
                  <span>{item}</span>
                  <GoldStar className="h-3.5 w-3.5 text-[#E5A93C]" />
                </span>
              ))}
            </div>
          </div>

          {/* Signature Pillars + Organized Large Logo Showcase Banner */}
          <section id="signatures" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            {/* Organized Brand Emblem Spotlight Card */}
            <div className="mb-16 overflow-hidden rounded-[2.25rem] border-2 border-[#E5A93C]/60 bg-gradient-to-r from-[#3A1902] via-[#4A2205] to-[#3A1902] p-6 text-[#FFFDF8] shadow-[0_20px_50px_rgba(58,25,2,0.2)] sm:p-10">
              <div className="flex flex-col items-center gap-8 text-center md:flex-row md:text-start">
                <div className="relative shrink-0">
                  <img
                    src="/images/logo.jpg"
                    alt="Golden Twins Crêpes"
                    className="logo-medallion-lg h-36 w-36 rounded-full object-cover sm:h-44 sm:w-44"
                  />
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#E5A93C]/40 bg-[#FFFDF8]/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#FCE092]">
                    <GoldStar className="h-3.5 w-3.5 text-[#E5A93C]" />
                    <span>{t.signatures.eyebrow}</span>
                  </div>
                  <h2 className="font-display mt-3 text-3xl font-bold text-[#FCE092] sm:text-4xl">
                    {t.signatures.title}
                  </h2>
                  <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[#F5E9D6] sm:text-base">
                    {t.signatures.subtitle}
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
                    <span className="rounded-full bg-[#E5A93C]/20 px-4 py-1.5 text-xs font-bold text-[#FCE092] ring-1 ring-[#E5A93C]/40">
                      ✦ El Mordjene
                    </span>
                    <span className="rounded-full bg-[#E5A93C]/20 px-4 py-1.5 text-xs font-bold text-[#FCE092] ring-1 ring-[#E5A93C]/40">
                      ✦ Nutella Original
                    </span>
                    <span className="rounded-full bg-[#E5A93C]/20 px-4 py-1.5 text-xs font-bold text-[#FCE092] ring-1 ring-[#E5A93C]/40">
                      ✦ Fruits Frais & Moukassirat
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {t.signatures.items.map((sig, idx) => {
                const isFeatured = idx === 0;
                return (
                  <motion.article
                    key={sig.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.32, 0.72, 0, 1] }}
                    className={isFeatured ? 'md:col-span-7' : 'md:col-span-5'}
                  >
                    <div className="group h-full rounded-[2rem] bg-[#E5A93C]/20 p-1.5 ring-1 ring-[#E5A93C]/45 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
                      <div className="flex h-full flex-col overflow-hidden rounded-[calc(2rem-0.375rem)] bg-[#FFFDF8] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                        <div
                          className={`relative overflow-hidden ${isFeatured ? 'h-72 sm:h-80' : 'h-60'}`}
                        >
                          <img
                            src={sig.image}
                            alt={sig.title}
                            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                          />
                          <span className="absolute top-4 left-4 rounded-full border border-[#E5A93C]/50 bg-[#3A1902]/90 px-3.5 py-1 text-[11px] font-bold tracking-wide text-[#FCE092] backdrop-blur-sm">
                            {sig.tag}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col justify-center p-6 sm:p-7">
                          <h3 className="font-display text-2xl font-bold text-[#3A1902]">
                            {sig.title}
                          </h3>
                          <p className="mt-2.5 text-sm leading-relaxed text-[#573114]">{sig.desc}</p>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </section>

          {/* Editorial Split Menu: Spotlight Card + Clean Menu List */}
          <section id="menu" className="border-y border-[#E5A93C]/30 bg-[#F5E9D6]/65 py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="flex flex-col items-start justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5A93C]/50 bg-[#FFFDF8] px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A5B13]">
                    <GoldStar className="h-3 w-3 text-[#E5A93C]" />
                    {t.menu.eyebrow}
                  </span>
                  <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-[#3A1902] sm:text-5xl">
                    {t.menu.title}
                  </h2>
                </div>

                {/* Category Tabs with Golden Twins Brown & Gold Pill */}
                <div className="flex flex-wrap gap-1.5 rounded-3xl border border-[#E5A93C]/40 bg-[#FFFDF8] p-1.5 shadow-xs">
                  {t.menu.categories.map((cat) => {
                    const active = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`relative rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                          active ? 'text-[#FCE092]' : 'text-[#573114] hover:text-[#3A1902]'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="activeCategoryPill"
                            transition={SPRING_UI}
                            className="absolute inset-0 rounded-full bg-[#3A1902] ring-1 ring-[#E5A93C]"
                          />
                        )}
                        <span className="relative z-10">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-12 grid gap-8 lg:grid-cols-12">
                {/* Left Featured Spotlight Item */}
                {spotlightItem && (
                  <div className="lg:col-span-5">
                    <div className="sticky top-24 rounded-[2rem] bg-gradient-to-b from-[#E5A93C]/40 to-[#B57316]/30 p-1.5 ring-1 ring-[#E5A93C]/60">
                      <div className="overflow-hidden rounded-[calc(2rem-0.375rem)] bg-[#FFFDF8] p-5">
                        <div className="relative h-64 overflow-hidden rounded-2xl">
                          <img
                            src={spotlightItem.image}
                            alt={spotlightItem.name}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border border-[#E5A93C]/50 bg-[#3A1902] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FCE092]">
                            <Flame className="h-3 w-3 text-[#E5A93C]" strokeWidth={1.8} />
                            {spotlightItem.badge || (isRtl ? 'مختار' : 'Sélection')}
                          </span>
                        </div>
                        <div className="mt-5">
                          <h3 className="font-display text-2xl font-bold text-[#3A1902]">
                            {spotlightItem.name}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-[#573114]">
                            {spotlightItem.desc}
                          </p>
                          <div className="mt-6 flex flex-wrap gap-2.5">
                            {spotlightItem.nutellaPrice ? (
                              <>
                                <button
                                  onClick={() =>
                                    addToCart({
                                      id: `${spotlightItem.id}-simple`,
                                      name: `${spotlightItem.name} (${t.menu.simpleLabel})`,
                                      price: spotlightItem.price,
                                      image: spotlightItem.image,
                                    })
                                  }
                                  className="btn-tactile flex flex-1 items-center justify-between gap-2 rounded-full border-2 border-[#E5A93C]/60 bg-[#FAF2E3] px-4 py-2.5 text-xs font-bold text-[#3A1902] hover:bg-[#F5E9D6]"
                                >
                                  <span>{t.menu.simpleLabel}</span>
                                  <span className="tabular-nums font-extrabold text-[#B57316]">
                                    {spotlightItem.price} {t.menu.currency}
                                  </span>
                                </button>
                                <button
                                  onClick={() =>
                                    addToCart({
                                      id: `${spotlightItem.id}-nutella`,
                                      name: `${spotlightItem.name} (${t.menu.nutellaLabel})`,
                                      price: spotlightItem.nutellaPrice,
                                      image: spotlightItem.image,
                                    })
                                  }
                                  className="btn-tactile flex flex-1 items-center justify-between gap-2 rounded-full bg-[#3A1902] px-4 py-2.5 text-xs font-bold text-[#FFFDF8] ring-1 ring-[#E5A93C] hover:bg-[#4F2304]"
                                >
                                  <span>{t.menu.nutellaLabel}</span>
                                  <span className="tabular-nums font-extrabold text-[#FCE092]">
                                    {spotlightItem.nutellaPrice} {t.menu.currency}
                                  </span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => addToCart(spotlightItem)}
                                className="btn-tactile flex w-full items-center justify-between rounded-full bg-[#3A1902] px-5 py-3 text-xs font-bold text-[#FFFDF8] ring-1 ring-[#E5A93C] hover:bg-[#4F2304]"
                              >
                                <span className="flex items-center gap-1.5">
                                  <Plus className="h-4 w-4 text-[#FCE092]" strokeWidth={1.8} />
                                  {t.menu.addToCart}
                                </span>
                                <span className="tabular-nums font-extrabold text-[#FCE092]">
                                  {spotlightItem.price
                                    ? `${spotlightItem.price} ${t.menu.currency}`
                                    : t.menu.priceOnSite}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Right Editorial Menu Rows */}
                <div className="space-y-3.5 lg:col-span-7">
                  {restMenuItems.map((item) => {
                    const qty = getItemQty(item.id);
                    return (
                      <article
                        key={item.id}
                        className="flex flex-col gap-4 rounded-3xl border border-[#E5A93C]/35 bg-[#FFFDF8] p-4 transition-shadow hover:shadow-[0_12px_30px_rgba(58,25,2,0.08)] sm:flex-row sm:items-center"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-20 w-full shrink-0 rounded-2xl object-cover ring-1 ring-[#E5A93C]/30 sm:w-20"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-[#3A1902] sm:text-base">
                              {item.name}
                            </h3>
                            {item.badge && (
                              <span className="rounded-md bg-[#E5A93C]/25 px-2 py-0.5 text-[10px] font-bold text-[#7A4918]">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-[#573114]">{item.desc}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 border-t border-[#E5A93C]/25 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                          {item.nutellaPrice ? (
                            <>
                              <button
                                onClick={() =>
                                  addToCart({
                                    id: `${item.id}-simple`,
                                    name: `${item.name} (${t.menu.simpleLabel})`,
                                    price: item.price,
                                    image: item.image,
                                  })
                                }
                                className="btn-tactile inline-flex items-center gap-1.5 rounded-full border border-[#E5A93C]/60 bg-[#FAF2E3] px-3 py-1.5 text-xs font-bold text-[#3A1902] hover:bg-[#F5E9D6]"
                              >
                                <span className="text-[11px] text-[#573114]">
                                  {t.menu.simpleLabel}
                                </span>
                                <span className="tabular-nums font-extrabold text-[#B57316]">
                                  {item.price} {t.menu.currency}
                                </span>
                                <Plus className="h-3 w-3" strokeWidth={1.8} />
                              </button>
                              <button
                                onClick={() =>
                                  addToCart({
                                    id: `${item.id}-nutella`,
                                    name: `${item.name} (${t.menu.nutellaLabel})`,
                                    price: item.nutellaPrice,
                                    image: item.image,
                                  })
                                }
                                className="btn-tactile inline-flex items-center gap-1.5 rounded-full bg-[#3A1902] px-3 py-1.5 text-xs font-bold text-[#FFFDF8] ring-1 ring-[#E5A93C]/70 hover:bg-[#4F2304]"
                              >
                                <span className="text-[11px] text-[#F5E9D6]">
                                  {t.menu.nutellaLabel}
                                </span>
                                <span className="tabular-nums font-extrabold text-[#FCE092]">
                                  {item.nutellaPrice} {t.menu.currency}
                                </span>
                                <Plus className="h-3 w-3 text-[#FCE092]" strokeWidth={1.8} />
                              </button>
                            </>
                          ) : qty === 0 ? (
                            <button
                              onClick={() => addToCart(item)}
                              className="btn-tactile inline-flex items-center gap-2 rounded-full bg-[#3A1902] px-4 py-2 text-xs font-bold text-[#FFFDF8] ring-1 ring-[#E5A93C]/70 hover:bg-[#4F2304]"
                            >
                              <span className="tabular-nums font-extrabold text-[#FCE092]">
                                {item.price
                                  ? `${item.price} ${t.menu.currency}`
                                  : t.menu.priceOnSite}
                              </span>
                              <Plus className="h-3.5 w-3.5 text-[#FCE092]" strokeWidth={1.6} />
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 rounded-full bg-[#FAF2E3] p-1 ring-1 ring-[#E5A93C]/50">
                              <button
                                onClick={() => updateQty(item.id, -1)}
                                className="btn-tactile flex h-7 w-7 items-center justify-center rounded-full bg-[#FFFDF8] text-[#3A1902]"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" strokeWidth={1.8} />
                              </button>
                              <span className="tabular-nums w-5 text-center text-xs font-extrabold text-[#3A1902]">
                                {qty}
                              </span>
                              <button
                                onClick={() => updateQty(item.id, 1)}
                                className="btn-tactile flex h-7 w-7 items-center justify-center rounded-full bg-[#3A1902] text-[#FCE092]"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" strokeWidth={1.8} />
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}

                  {/* Supplements Strip */}
                  <div className="mt-6 rounded-3xl border-2 border-[#E5A93C]/50 bg-[#FFFDF8] p-5">
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9A5B13]">
                      <GoldStar className="h-3.5 w-3.5 text-[#E5A93C]" />
                      {t.menu.supplementsTitle}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {t.menu.supplements.map((sup) => (
                        <button
                          key={sup.id}
                          onClick={() =>
                            addToCart({
                              id: sup.id,
                              name: sup.name,
                              price: sup.price,
                              image: '/images/crepes.jpg',
                            })
                          }
                          className="btn-tactile inline-flex items-center gap-2 rounded-full border border-[#E5A93C]/50 bg-[#FAF2E3] px-3.5 py-2 text-xs font-bold text-[#3A1902] hover:bg-[#E5A93C]/25"
                        >
                          <span>{sup.name}</span>
                          <span className="tabular-nums font-extrabold text-[#B57316]">
                            +{sup.price} {t.menu.currency}
                          </span>
                          <Plus className="h-3 w-3 text-[#3A1902]" strokeWidth={1.8} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Customizer Atelier in Golden Twins Beige & Gold Palette */}
          <section id="customizer" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <div className="rounded-[2.25rem] bg-gradient-to-br from-[#FCE092] via-[#E5A93C] to-[#B57316] p-1.5 shadow-[0_20px_50px_rgba(58,25,2,0.12)]">
              <div className="overflow-hidden rounded-[calc(2.25rem-0.375rem)] bg-[#FAF2E3] p-6 text-[#3A1902] sm:p-10">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#E5A93C]/40 pb-6 md:flex-row md:items-end">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5A93C]/60 bg-[#FFFDF8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A5B13]">
                      <GoldStar className="h-3 w-3 text-[#E5A93C]" />
                      {t.customizer.eyebrow}
                    </span>
                    <h2 className="font-display mt-3 text-3xl font-bold sm:text-4xl">
                      {t.customizer.title}
                    </h2>
                    <p className="mt-2 text-sm text-[#573114]">{t.customizer.subtitle}</p>
                  </div>
                  <div className="rounded-2xl border border-[#E5A93C]/50 bg-[#3A1902] px-6 py-3.5 text-center text-[#FFFDF8]">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5E9D6]">
                      {t.customizer.total}
                    </span>
                    <span className="tabular-nums text-2xl font-extrabold text-[#FCE092]">
                      {customPrice} {t.menu.currency}
                    </span>
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                  {/* Live Visual Preview Card */}
                  <div className="lg:col-span-4">
                    <div className="flex h-full flex-col justify-between rounded-3xl border border-[#E5A93C]/50 bg-[#FFFDF8] p-4">
                      <div>
                        <div className="relative h-52 overflow-hidden rounded-2xl">
                          <img
                            src={baseObj.image}
                            alt={baseObj.name}
                            className="h-full w-full object-cover transition-all duration-500"
                          />
                          <span className="absolute top-3 left-3 rounded-full border border-[#E5A93C]/50 bg-[#3A1902]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FCE092] backdrop-blur-sm">
                            {t.customizer.previewLabel}
                          </span>
                        </div>
                        <h3 className="font-display mt-4 text-xl font-bold text-[#3A1902]">
                          {baseObj.name}
                        </h3>
                        <p className="mt-1 text-xs font-bold text-[#B57316]">+ {sauceObj.name}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {toppingObjs.map((tp) => (
                            <span
                              key={tp.id}
                              className="rounded-full border border-[#E5A93C]/40 bg-[#FAF2E3] px-2.5 py-1 text-[11px] font-semibold text-[#3A1902]"
                            >
                              {tp.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleAddCustom}
                        className="btn-tactile group mt-6 flex w-full items-center justify-between rounded-full bg-[#3A1902] py-2 ps-5 pe-2 text-sm font-bold text-[#FFFDF8] ring-1 ring-[#E5A93C] hover:bg-[#4F2304]"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-[#FCE092]" strokeWidth={1.6} />
                          <span>{t.customizer.addCustom}</span>
                        </span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-[#FCE092] to-[#E5A93C] text-[#240F01] transition-transform duration-300 group-hover:scale-105">
                          <Plus className="h-4 w-4" strokeWidth={1.8} />
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 3-Step Controls */}
                  <div className="grid gap-6 sm:grid-cols-3 lg:col-span-8">
                    <div>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#7A4918]">
                        {t.customizer.step1}
                      </h3>
                      <div className="space-y-2">
                        {t.customizer.bases.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBase(b.id)}
                            className={`btn-tactile flex w-full items-center justify-between rounded-2xl border px-3.5 py-3 text-xs font-bold ${
                              selectedBase === b.id
                                ? 'border-[#E5A93C] bg-[#3A1902] text-[#FFFDF8]'
                                : 'border-[#E5A93C]/35 bg-[#FFFDF8] text-[#3A1902] hover:border-[#E5A93C]'
                            }`}
                          >
                            <span>{b.name}</span>
                            <span
                              className={`tabular-nums font-extrabold ${
                                selectedBase === b.id ? 'text-[#FCE092]' : 'text-[#B57316]'
                              }`}
                            >
                              {b.price} {t.menu.currency}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#7A4918]">
                        {t.customizer.step2}
                      </h3>
                      <div className="space-y-2">
                        {t.customizer.sauces.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSauce(s.id)}
                            className={`btn-tactile flex w-full items-center justify-between rounded-2xl border px-3.5 py-3 text-xs font-bold ${
                              selectedSauce === s.id
                                ? 'border-[#E5A93C] bg-[#3A1902] text-[#FFFDF8]'
                                : 'border-[#E5A93C]/35 bg-[#FFFDF8] text-[#3A1902] hover:border-[#E5A93C]'
                            }`}
                          >
                            <span>{s.name}</span>
                            <span
                              className={`tabular-nums font-extrabold ${
                                selectedSauce === s.id ? 'text-[#FCE092]' : 'text-[#B57316]'
                              }`}
                            >
                              +{s.price} {t.menu.currency}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#7A4918]">
                        {t.customizer.step3}
                      </h3>
                      <div className="space-y-2">
                        {t.customizer.toppings.map((tp) => {
                          const checked = selectedToppings.includes(tp.id);
                          return (
                            <button
                              key={tp.id}
                              onClick={() => toggleTopping(tp.id)}
                              className={`btn-tactile flex w-full items-center justify-between rounded-2xl border px-3.5 py-2.5 text-xs font-bold ${
                                checked
                                  ? 'border-[#E5A93C] bg-[#3A1902] text-[#FFFDF8]'
                                  : 'border-[#E5A93C]/35 bg-[#FFFDF8] text-[#3A1902] hover:border-[#E5A93C]'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                                    checked
                                      ? 'border-[#FCE092] bg-[#E5A93C] text-[#240F01]'
                                      : 'border-[#3A1902]/30'
                                  }`}
                                >
                                  {checked && <Check className="h-3 w-3" strokeWidth={2.4} />}
                                </span>
                                {tp.name}
                              </span>
                              <span
                                className={`tabular-nums font-extrabold ${
                                  checked ? 'text-[#FCE092]' : 'text-[#B57316]'
                                }`}
                              >
                                +{tp.price} {t.menu.currency}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Visit Us / Bordj Mnaiel */}
          <section id="visit" className="border-t border-[#E5A93C]/30 bg-[#FFFDF8] py-24">
            <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5A93C]/50 bg-[#FAF2E3] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A5B13]">
                  <GoldStar className="h-3 w-3 text-[#E5A93C]" />
                  {t.visit.eyebrow}
                </span>
                <h2 className="font-display mt-3 text-3xl font-bold text-[#3A1902] sm:text-4xl">
                  {t.visit.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#573114] sm:text-base">
                  {t.visit.subtitle}
                </p>

                <div className="mt-8 space-y-3.5">
                  <div className="flex items-start gap-3.5 rounded-2xl border border-[#E5A93C]/35 bg-[#FAF2E3] p-4">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#B57316]" strokeWidth={1.6} />
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7A4918]">
                        {t.visit.addressLabel}
                      </span>
                      <span className="text-sm font-bold text-[#3A1902]">
                        {isRtl ? BRAND.cityAr : BRAND.cityFr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 rounded-2xl border border-[#E5A93C]/35 bg-[#FAF2E3] p-4">
                    <Truck className="mt-0.5 h-5 w-5 shrink-0 text-[#B57316]" strokeWidth={1.6} />
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7A4918]">
                        {t.visit.hoursLabel}
                      </span>
                      <span className="text-sm font-bold text-[#3A1902]">
                        {isRtl ? BRAND.hoursAr : BRAND.hoursFr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 rounded-2xl border border-[#E5A93C]/35 bg-[#FAF2E3] p-4">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#B57316]" strokeWidth={1.6} />
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7A4918]">
                        {isRtl ? 'الهاتف والطلب المباشر' : 'Téléphone & Livraison'}
                      </span>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm font-extrabold text-[#3A1902]">
                        <a
                          href={`tel:${BRAND.phone1Raw}`}
                          className="tabular-nums underline decoration-[#E5A93C] underline-offset-4 hover:text-[#B57316]"
                        >
                          {BRAND.phone1}
                        </a>
                        <span>•</span>
                        <a
                          href={`tel:${BRAND.phone2Raw}`}
                          className="tabular-nums underline decoration-[#E5A93C] underline-offset-4 hover:text-[#B57316]"
                        >
                          {BRAND.phone2}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=PPR6%2B97F%2C+Bd+Amirouche%2C+Bordj+Menaiel%2C+Wilaya+de+Boumerdes"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-tactile inline-flex items-center gap-2 rounded-full bg-[#3A1902] px-5 py-3 text-xs font-bold text-[#FFFDF8] ring-1 ring-[#E5A93C] hover:bg-[#4F2304]"
                  >
                    <MapPin className="h-4 w-4 text-[#FCE092]" strokeWidth={1.6} />
                    <span>{t.visit.mapsBtn}</span>
                  </a>
                  <a
                    href={`https://wa.me/${BRAND.whatsappNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-tactile inline-flex items-center gap-2 rounded-full border-2 border-[#E5A93C]/60 bg-[#FAF2E3] px-5 py-3 text-xs font-bold text-[#3A1902] hover:border-[#25D366] hover:bg-[#25D366]/10"
                  >
                    <MessageCircle className="h-4 w-4 text-[#25D366]" strokeWidth={1.7} />
                    <span>{t.visit.whatsappBtn}</span>
                  </a>
                  <a
                    href={BRAND.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-tactile inline-flex items-center gap-2 rounded-full border-2 border-[#E5A93C]/60 bg-[#FAF2E3] px-5 py-3 text-xs font-bold text-[#3A1902] hover:border-[#E1306C] hover:bg-[#E1306C]/10"
                  >
                    <Camera className="h-4 w-4 text-[#E1306C]" strokeWidth={1.7} />
                    <span>{BRAND.instagram}</span>
                  </a>
                </div>
              </div>

              <div className="rounded-[2rem] bg-gradient-to-br from-[#FCE092] via-[#E5A93C] to-[#B57316] p-1.5 shadow-lg">
                <div className="overflow-hidden rounded-[calc(2rem-0.375rem)] bg-[#FFFDF8]">
                  <iframe
                    title="Golden Twins Bordj Menaïel"
                    src="https://www.google.com/maps?q=PPR6%2B97F,+Bd+Amirouche,+Bordj+Menaiel,+Wilaya+de+Boumerdes,+Algeria&output=embed"
                    className="h-80 w-full border-0 sm:h-96"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer with Large Medallion Logo & Ribbon Brown Background */}
        <footer className="border-t-2 border-[#E5A93C] bg-[#3A1902] py-16 text-center text-[#F5E9D6]">
          <div className="mx-auto max-w-6xl px-4">
            <img
              src="/images/logo.jpg"
              alt={BRAND.name}
              className="logo-medallion-lg mx-auto mb-5 h-28 w-28 rounded-full object-cover sm:h-32 sm:w-32"
            />
            <div className="flex items-center justify-center gap-2">
              <GoldStar className="h-4 w-4 text-[#E5A93C]" />
              <p className="font-display text-2xl font-bold text-[#FCE092] sm:text-3xl">
                {BRAND.name}
              </p>
              <GoldStar className="h-4 w-4 text-[#E5A93C]" />
            </div>
            <p className="mt-2 text-xs text-[#F5E9D6]/90">{t.footer.tagline}</p>
            <p className="mt-1 text-xs font-bold text-[#FCE092]">{BRAND.phone}</p>
            <p className="mt-6 text-[11px] text-[#E5A93C]/70">{t.footer.rights}</p>
          </div>
        </footer>

        {/* Sticky Mobile Cart Bar */}
        <AnimatePresence>
          {cartCount > 0 && !isCartOpen && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={SPRING_UI}
              className="fixed inset-x-4 bottom-4 z-30 md:hidden"
            >
              <button
                onClick={() => setIsCartOpen(true)}
                className="btn-tactile flex w-full items-center justify-between rounded-full bg-[#3A1902] px-5 py-3.5 text-xs font-bold text-[#FFFDF8] shadow-[0_14px_34px_rgba(58,25,2,0.35)] ring-2 ring-[#E5A93C]"
              >
                <span className="flex items-center gap-2">
                  <span className="tabular-nums flex h-6 min-w-6 items-center justify-center rounded-full bg-gradient-to-b from-[#FCE092] to-[#E5A93C] px-1.5 text-[11px] font-extrabold text-[#240F01]">
                    {cartCount}
                  </span>
                  <span>{t.cart.viewBar}</span>
                </span>
                <span className="tabular-nums text-sm font-extrabold text-[#FCE092]">
                  {cartTotal} {t.menu.currency}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spring-driven Cart Drawer */}
        <AnimatePresence>
          {isCartOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs"
              onClick={() => setIsCartOpen(false)}
            >
              <motion.aside
                initial={{ x: isRtl ? '-100%' : '100%' }}
                animate={{ x: 0 }}
                exit={{ x: isRtl ? '-100%' : '100%' }}
                transition={SPRING_DRAWER}
                onClick={(e) => e.stopPropagation()}
                className="flex h-full w-full max-w-md flex-col justify-between border-s-2 border-[#E5A93C] bg-[#FFFDF8] p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-[#E5A93C]/35 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="/images/logo.jpg"
                      alt={BRAND.name}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-[#E5A93C]"
                    />
                    <h3 className="font-display text-xl font-bold text-[#3A1902]">
                      {t.cart.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="btn-tactile rounded-full p-2 text-[#3A1902] hover:bg-[#FAF2E3]"
                    aria-label="Close cart"
                  >
                    <X className="h-5 w-5" strokeWidth={1.6} />
                  </button>
                </div>

                <div className="my-4 flex-1 space-y-3 overflow-y-auto pe-1">
                  {cart.length === 0 ? (
                    <p className="py-12 text-center text-sm text-[#573114]">{t.cart.empty}</p>
                  ) : (
                    cart.map((item) => {
                      const itemSups = item.itemSupplements || [];
                      const unitPrice = getItemUnitPrice(item);
                      const canAddSup =
                        !item.id.startsWith('sup-') && !item.id.startsWith('dr-');
                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-[#E5A93C]/40 bg-[#FAF2E3]/65 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-14 w-14 rounded-xl object-cover"
                            />
                            <div className="flex-1">
                              <p className="text-xs font-bold text-[#3A1902]">{item.name}</p>
                              <p className="tabular-nums mt-0.5 text-xs font-extrabold text-[#B57316]">
                                {item.price !== null && item.price !== undefined
                                  ? `${unitPrice * item.qty} ${t.menu.currency}`
                                  : t.menu.priceOnSite}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => updateQty(item.id, -1)}
                                className="btn-tactile flex h-7 w-7 items-center justify-center rounded-full bg-[#FFFDF8] text-[#3A1902] ring-1 ring-[#E5A93C]/40"
                              >
                                <Minus className="h-3 w-3" strokeWidth={1.8} />
                              </button>
                              <span className="tabular-nums w-5 text-center text-xs font-extrabold text-[#3A1902]">
                                {item.qty}
                              </span>
                              <button
                                onClick={() => updateQty(item.id, 1)}
                                className="btn-tactile flex h-7 w-7 items-center justify-center rounded-full bg-[#3A1902] text-[#FCE092]"
                              >
                                <Plus className="h-3 w-3" strokeWidth={1.8} />
                              </button>
                            </div>
                          </div>

                          {/* Per-Item Supplement Chips */}
                          {canAddSup && (
                            <div className="mt-2.5 border-t border-[#E5A93C]/25 pt-2">
                              <span className="block text-[10px] font-bold text-[#7A4918]">
                                {t.cart.addSupLabel}
                              </span>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {t.menu.supplements.slice(0, 3).map((sup) => {
                                  const active = itemSups.some((s) => s.id === sup.id);
                                  const shortName = sup.name
                                    .replace('Supplément ', '')
                                    .replace('إضافة ', '');
                                  return (
                                    <button
                                      key={sup.id}
                                      onClick={() => toggleItemSupplement(item.id, sup)}
                                      className={`btn-tactile inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                        active
                                          ? 'bg-[#3A1902] text-[#FCE092] ring-1 ring-[#E5A93C]'
                                          : 'bg-[#FFFDF8] text-[#3A1902] ring-1 ring-[#E5A93C]/40 hover:bg-[#E5A93C]/20'
                                      }`}
                                    >
                                      {active && <Check className="h-2.5 w-2.5" strokeWidth={2.5} />}
                                      <span>{shortName}</span>
                                      <span className="tabular-nums opacity-80">
                                        +{sup.price}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="space-y-2.5 border-t border-[#E5A93C]/35 pt-3.5">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={t.cart.namePlaceholder}
                      className="w-full rounded-xl border border-[#E5A93C]/50 bg-[#FAF2E3]/50 px-3.5 py-2 text-xs outline-none focus:border-[#3A1902]"
                    />
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder={t.cart.addressPlaceholder}
                      className="w-full rounded-xl border border-[#E5A93C]/50 bg-[#FAF2E3]/50 px-3.5 py-2 text-xs outline-none focus:border-[#3A1902]"
                    />
                    <input
                      type="text"
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder={t.cart.notePlaceholder}
                      className="w-full rounded-xl border border-[#E5A93C]/50 bg-[#FAF2E3]/50 px-3.5 py-2 text-xs outline-none focus:border-[#3A1902]"
                    />

                    {/* Live Final Order Message Box */}
                    <div className="rounded-xl border border-[#E5A93C]/40 bg-[#FAF2E3]/80 p-2.5">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A4918]">
                          {t.cart.previewTitle}
                        </span>
                        <button
                          onClick={handleCopyOrder}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3A1902] underline decoration-[#E5A93C] hover:text-[#B57316]"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{t.cart.copyBtn}</span>
                        </button>
                      </div>
                      <pre className="max-h-24 overflow-y-auto whitespace-pre-wrap font-sans text-[11px] leading-snug text-[#3A1902]">
                        {buildOrderMessage()}
                      </pre>
                    </div>

                    <div className="flex items-center justify-between py-0.5 text-base font-extrabold text-[#3A1902]">
                      <span>{t.cart.total}</span>
                      <span className="tabular-nums text-[#B57316]">
                        {cartTotal} {t.menu.currency}
                      </span>
                    </div>

                    {/* Primary Instagram DM + WhatsApp Checkout Buttons */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleInstagramOrder}
                        className="btn-tactile flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] px-5 py-3 text-xs font-extrabold text-white shadow-md transition hover:brightness-105"
                      >
                        <Camera className="h-4 w-4" strokeWidth={1.8} />
                        <span>{t.cart.checkoutInstagram}</span>
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setCart([])}
                          className="btn-tactile flex items-center justify-center gap-1 rounded-full border border-[#E5A93C]/60 px-3.5 py-2.5 text-xs font-bold text-[#573114] hover:bg-[#FAF2E3]"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                          <span>{t.cart.clear}</span>
                        </button>
                        <button
                          onClick={handleWhatsAppOrder}
                          className="btn-tactile flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-xs font-extrabold text-white transition hover:brightness-95"
                        >
                          <MessageCircle className="h-4 w-4" strokeWidth={1.7} />
                          <span>{t.cart.checkoutWhatsapp}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Big Instagram Copy & Paste Instruction Modal */}
        <AnimatePresence>
          {igModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
              onClick={() => setIgModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 12 }}
                transition={SPRING_UI}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg rounded-[2rem] border-2 border-[#E5A93C] bg-[#FFFDF8] p-6 text-center shadow-[0_24px_64px_rgba(0,0,0,0.45)] sm:p-8"
              >
                <button
                  onClick={() => setIgModalOpen(false)}
                  className="btn-tactile absolute top-4 right-4 rounded-full p-2 text-[#3A1902] hover:bg-[#FAF2E3]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-[#833AB4] via-[#E1306C] to-[#F77737] text-white shadow-lg">
                  <Check className="h-8 w-8" strokeWidth={2.5} />
                </div>

                <span className="inline-block rounded-full bg-emerald-500/15 px-3.5 py-1 text-xs font-extrabold text-emerald-700">
                  {lang === 'fr' ? '✓ Commande copiée automatiquement' : '✓ تم نسخ الطلب تلقائياً'}
                </span>

                <h3 className="font-display mt-3 text-2xl font-extrabold text-[#3A1902] sm:text-3xl">
                  {lang === 'fr'
                    ? 'Faites « Coller » dans les messages Instagram'
                    : 'إلصق هذا في الرسائل'}
                </h3>

                <p className="mt-2 text-sm font-medium text-[#573114]">
                  {lang === 'fr'
                    ? 'Votre commande est copiée. Cliquez ci-dessous pour ouvrir Instagram, puis faites "Coller" (Appui long → Coller ou Ctrl+V) et envoyez.'
                    : 'تم نسخ طلبك بالكامل. اضغط على الزر بالأسفل لفتح محادثة إنستغرام، ثم اضغط "لصق" (إلصق هذا في الرسائل) وأرسله.'}
                </p>

                {/* Copied Message Box */}
                <div className="my-5 rounded-2xl border-2 border-[#E5A93C]/50 bg-[#FAF2E3] p-3.5 text-start">
                  <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap font-sans text-xs font-semibold leading-relaxed text-[#3A1902]">
                    {buildOrderMessage()}
                  </pre>
                </div>

                <button
                  onClick={handleConfirmOpenInstagram}
                  className="btn-tactile flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] px-6 py-4 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(225,48,108,0.35)] transition hover:brightness-105"
                >
                  <Camera className="h-5 w-5" strokeWidth={2} />
                  <span>
                    {lang === 'fr'
                      ? 'Continuer vers Instagram & Coller'
                      : 'الذهاب إلى إنستغرام ولصق الطلب'}
                  </span>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
