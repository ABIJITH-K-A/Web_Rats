import { useState } from "react";
import {
  LifeBuoy,
  Mail,
  MessageCircle,
  UserCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import AccordionToggleIcon from "../../components/ui/AccordionToggleIcon";
import { Button, Card } from "../../components/ui/Primitives";
import {
  CLIENT_FAQS,
  CONTACT_INFO,
  HELP_PROMISES,
  WORKER_FAQS,
} from "../../data/siteData";

const AccordionItem = ({ question, answer, isOpen, onClick }) => (
  <div className="overflow-hidden rounded-2xl border border-white/8 bg-secondary-dark/50">
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
    >
      <span className="text-base font-semibold text-white">{question}</span>
      <AccordionToggleIcon open={isOpen} />
    </button>
    {isOpen && (
      <div className="overflow-hidden">
        <div className="border-t border-white/8 px-6 py-5 text-sm leading-7 text-light-gray/68">
          {answer}
        </div>
      </div>
    )}
  </div>
);

const Help = () => {
  const [openClientFaq, setOpenClientFaq] = useState(null);
  const [openWorkerFaq, setOpenWorkerFaq] = useState(null);

  return (
    <div className="flex flex-col py-20">
      <section className="pb-18">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-6 inline-flex rounded-full border border-cyan-primary/20 bg-cyan-primary/8 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-primary">
            Support Center
          </div>
          <h1 className="mx-auto max-w-5xl text-5xl font-black leading-[1.05] text-white md:text-6xl">
            Questions for clients, workers, and active bookings now live in one
            place.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-light-gray/70">
            If you are unsure about service scope, payment flow, delivery
            expectations, or what happens after booking, this page is the quick
            reference point.
          </p>
        </div>
      </section>

      <section className="pb-18">
        <div className="container mx-auto grid gap-6 px-6 md:grid-cols-3">
          {[
            {
              title: "Email support",
              icon: Mail,
              text: "Best for detailed scope, quotes, and anything that needs written back-and-forth.",
              href: `mailto:${CONTACT_INFO.email}?subject=Rynix Support`,
              action: "Email Us",
              external: true,
            },
            {
              title: "WhatsApp support",
              icon: MessageCircle,
              text: "Best for quick follow-up, manual clarifications, and fast service triage.",
              href: `https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(
                "Hi Rynix, I need help with a service or booking."
              )}`,
              action: "Chat On WhatsApp",
              external: true,
            },
            {
              title: "Account support",
              icon: UserCircle,
              text: "Use your account area once you sign in to review orders, status, and saved details.",
              href: "/join",
              action: "Open Sign In",
              external: false,
            },
          ].map((item) => {
            const Icon = item.icon;
            const content = (
              <Card className="flex h-full flex-col border-white/8 bg-black/72">
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-primary/10 text-cyan-primary">
                  <Icon size={24} />
                </div>
                <h2 className="text-2xl font-black text-white">{item.title}</h2>
                <p className="mt-4 flex-1 text-sm leading-7 text-light-gray/66">
                  {item.text}
                </p>
                <div className="mt-8">
                  <Button className="w-full">{item.action}</Button>
                </div>
              </Card>
            );

            return (
              <div key={item.title}>
                {item.external ? (
                  <a href={item.href} rel="noreferrer">
                    {content}
                  </a>
                ) : (
                  <Link to={item.href}>{content}</Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-secondary-dark/28 py-20">
        <div className="container mx-auto grid gap-8 px-6 lg:grid-cols-2">
          <Card className="border-white/8 bg-black/72">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-primary/72">
              Client FAQ
            </div>
            <h2 className="mt-4 text-3xl font-black text-white">
              For customers and buyers
            </h2>
            <div className="mt-8 space-y-4">
              {CLIENT_FAQS.map((faq, index) => (
                <AccordionItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openClientFaq === index}
                  onClick={() =>
                    setOpenClientFaq(openClientFaq === index ? null : index)
                  }
                />
              ))}
            </div>
          </Card>

          <Card className="border-white/8 bg-black/72">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-primary/72">
              Team FAQ
            </div>
            <h2 className="mt-4 text-3xl font-black text-white">
              For workers and project handling
            </h2>
            <div className="mt-8 space-y-4">
              {WORKER_FAQS.map((faq, index) => (
                <AccordionItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openWorkerFaq === index}
                  onClick={() =>
                    setOpenWorkerFaq(openWorkerFaq === index ? null : index)
                  }
                />
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto grid gap-6 px-6 md:grid-cols-3">
          {HELP_PROMISES.map((item) => (
            <div key={item.title}>
              <Card className="h-full border-white/8 bg-secondary-dark/72">
                <LifeBuoy size={22} className="mb-5 text-cyan-primary" />
                <h2 className="text-2xl font-black text-white">{item.title}</h2>
                <p className="mt-4 text-sm leading-7 text-light-gray/66">
                  {item.text}
                </p>
              </Card>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-10 pt-4">
        <div className="container mx-auto px-6">
          <Card className="border-cyan-primary/12 bg-black/75 py-14 text-center">
            <h2 className="text-4xl font-black text-white">
              Need help deciding the next step?
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-light-gray/68">
              Message us directly or open the booking flow and leave a detailed
              note. We will help map the request to the right service.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/book">
                <Button>Open Booking</Button>
              </Link>
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline">Contact Support</Button>
              </a>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Help;
