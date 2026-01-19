'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Mail, MessageSquare, Github } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { type Locale } from '@/lib/i18n/config';

interface ContactPageClientProps {
  locale: Locale;
}

export default function ContactPageClient({ locale }: ContactPageClientProps) {
  const t = useTranslations('contactPage');
  const tCommon = useTranslations('common');

  const contactMethods = [
    {
      icon: Mail,
      title: t('methods.email.title'),
      description: t('methods.email.description'),
      action: t('methods.email.action'),
      href: 'mailto:info@lucazanner.de',
    },
    {
      icon: Github,
      title: t('methods.github.title'),
      description: t('methods.github.description'),
      action: t('methods.github.action'),
      href: 'https://github.com/Hugo9809/pdfcraft',
    },
  ];



  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[hsl(var(--color-muted)/0.3)] py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-[hsl(var(--color-foreground))] mb-4">
                {t('hero.title')}
              </h1>
              <p className="text-[hsl(var(--color-muted-foreground))]">
                {t('hero.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <a
                    key={index}
                    href={method.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card className="p-6 h-full text-center" hover>
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[hsl(var(--color-primary)/0.1)] mb-4">
                        <Icon className="h-6 w-6 text-[hsl(var(--color-primary))]" />
                      </div>
                      <h3 className="font-semibold text-[hsl(var(--color-foreground))] mb-2">
                        {method.title}
                      </h3>
                      <p className="text-sm text-[hsl(var(--color-muted-foreground))] mb-4">
                        {method.description}
                      </p>
                      <span className="text-sm font-medium text-[hsl(var(--color-primary))]">
                        {method.action}
                      </span>
                    </Card>
                  </a>
                );
              })}
            </div>
          </div>
        </section>



        {/* FAQ Link */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--color-muted-foreground))]" />
              <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))] mb-4">
                {t('faq.title')}
              </h2>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-6">
                {t('faq.description', { brand: tCommon('brand') })}
              </p>
              <Link href={`/${locale}/faq`}>
                <Button variant="outline">
                  {t('faq.button')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
