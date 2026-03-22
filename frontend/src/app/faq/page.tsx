"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { useRouter } from "next/navigation";

const faqs = [
  {
    category: "Orders & Shipping",
    items: [
      {
        q: "How long does delivery take?",
        a: "We typically dispatch orders within 1-2 business days. Delivery takes 3-5 business days depending on your location. Metro cities usually receive orders within 3 days.",
      },
      {
        q: "Is shipping free?",
        a: "Yes! We offer free shipping on all orders above ₹999. For orders below ₹999, a flat shipping charge of ₹60 applies.",
      },
      {
        q: "Can I track my order?",
        a: "Yes, once your order is dispatched, you'll receive a tracking link via email and SMS. You can also track your order from the 'My Orders' section after logging in.",
      },
      {
        q: "Do you deliver across India?",
        a: "Yes, we deliver to all major cities and towns across India through our logistics partners.",
      },
    ],
  },
  {
    category: "Products & Quality",
    items: [
      {
        q: "What does 'cold-pressed' mean?",
        a: "Cold-pressed means the oil is extracted using mechanical pressure at low temperatures (below 50°C). Unlike refined oils that use chemical solvents and high heat, cold-pressing preserves the natural nutrients, antioxidants, and flavor of the oil.",
      },
      {
        q: "What is the shelf life of your oils?",
        a: "Our cold-pressed oils have a shelf life of 6-8 months from the date of extraction. We recommend storing them in a cool, dark place away from direct sunlight. Refrigeration can extend the life further.",
      },
      {
        q: "Why does cold-pressed oil look different from regular oil?",
        a: "Cold-pressed oils retain their natural color, aroma, and slight sediment — this is a sign of purity. Refined oils appear clear because they've been bleached and deodorized, stripping away beneficial compounds.",
      },
      {
        q: "Are your products organic?",
        a: "Our products are grown using natural farming practices with minimal chemical input. While we are in the process of getting formal organic certification, our farming methods prioritize soil health and sustainability.",
      },
      {
        q: "What is Chakki Aata and how is it different?",
        a: "Chakki Aata is stone-ground flour made using traditional grinding stones (chakki). Unlike roller mill flour, stone grinding preserves the bran, germ, and fiber content, giving you more nutritious flour with a better texture for rotis.",
      },
      {
        q: "Are your millet cookies healthy?",
        a: "Yes! Our millet cookies are made with stone-ground millet flour, jaggery, and natural ingredients. They contain no maida (refined flour), no refined sugar, and no artificial preservatives.",
      },
    ],
  },
  {
    category: "Storage & Usage",
    items: [
      {
        q: "How should I store cold-pressed oil?",
        a: "Store in a cool, dark place away from direct sunlight and heat. Keep the bottle tightly sealed after use. You can also refrigerate it — the oil may solidify slightly but will return to normal at room temperature.",
      },
      {
        q: "Can cold-pressed oil be used for deep frying?",
        a: "Cold-pressed oils are best for low to medium heat cooking, drizzling on salads, or as a finishing oil. For deep frying, groundnut oil has a higher smoke point and works better. We recommend using our oils for tadka, sautéing, and everyday cooking to get the full nutritional benefits.",
      },
      {
        q: "How should I store Chakki Aata?",
        a: "Store in an airtight container in a cool, dry place. Since stone-ground flour retains natural oils from the grain, it's best consumed within 2-3 months. Refrigeration can extend freshness.",
      },
    ],
  },
  {
    category: "Payments & Returns",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept UPI, credit/debit cards, net banking, and popular wallets. Cash on Delivery (COD) is available for select pin codes.",
      },
      {
        q: "What is your return policy?",
        a: "If you receive a damaged or incorrect product, please contact us within 48 hours of delivery with photos. We'll arrange a replacement or full refund. Due to the nature of food products, we cannot accept returns for opened/used items.",
      },
      {
        q: "How do refunds work?",
        a: "Refunds are processed within 5-7 business days to your original payment method once we verify the return/complaint.",
      },
    ],
  },
];

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState<"products" | "analysis">("products");
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const router = useRouter();

  const toggleFaq = (key: string) => {
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="site-wrapper">
      <div className="bg-fixed" />
      <div className="bg-overlay" />
      <div className="content-layer">
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} onChatOpen={() => {}} />

        <main className="info-page">
          <div className="info-container">
            <button className="back-btn" onClick={() => router.back()}>
              ← Back
            </button>
            <h1 className="info-title">Frequently Asked Questions</h1>
            <p className="info-subtitle">Everything you need to know about KrishiMane products</p>

            <div className="faq-list">
              {faqs.map((category, ci) => (
                <div key={ci} className="faq-category">
                  <h2 className="faq-category-title">{category.category}</h2>
                  {category.items.map((item, qi) => {
                    const key = `${ci}-${qi}`;
                    const isOpen = openIndex === key;
                    return (
                      <div key={key} className={`faq-item ${isOpen ? "open" : ""}`}>
                        <button className="faq-question" onClick={() => toggleFaq(key)}>
                          <span>{item.q}</span>
                          <span className="faq-chevron">{isOpen ? "−" : "+"}</span>
                        </button>
                        {isOpen && (
                          <div className="faq-answer">
                            <p>{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
