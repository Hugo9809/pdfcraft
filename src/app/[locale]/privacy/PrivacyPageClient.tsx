'use client';

import { useTranslations } from 'next-intl';
import { Shield, Lock, Eye, Server, Trash2, Cookie, Globe, Mail } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { type Locale } from '@/lib/i18n/config';

interface PrivacyPageClientProps {
  locale: Locale;
}

export default function PrivacyPageClient({ locale }: PrivacyPageClientProps) {
  const t = useTranslations('privacyPage');
  const tCommon = useTranslations('common');

  const privacyHighlights = [
    {
      icon: Server,
      title: t('highlights.server.title'),
      description: t('highlights.server.description'),
    },
    {
      icon: Lock,
      title: t('highlights.local.title'),
      description: t('highlights.local.description'),
    },
    {
      icon: Trash2,
      title: t('highlights.cleanup.title'),
      description: t('highlights.cleanup.description'),
    },
    {
      icon: Eye,
      title: t('highlights.tracking.title'),
      description: t('highlights.tracking.description'),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[hsl(var(--color-muted)/0.3)] py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-[hsl(var(--color-foreground))] mb-6">
                {t('title')}
              </h1>
              <p className="text-lg text-[hsl(var(--color-muted-foreground))]">
                {t('intro', { brand: tCommon('brand') })}
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Highlights */}
        <section className="py-12 bg-[hsl(var(--color-muted)/0.3)]">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {privacyHighlights.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="p-6 text-center" hover>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                      <Icon className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-[hsl(var(--color-foreground))] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[hsl(var(--color-muted-foreground))]">
                      {item.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Privacy Policy Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-lg">
              <p className="text-sm text-[hsl(var(--color-muted-foreground))] mb-8">
                {t('lastUpdated')}
              </p>

              <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))] mt-8 mb-4">
                {t('sections.introduction.title')}
              </h2>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t('sections.introduction.content', { brand: tCommon('brand') })}
              </p>

              <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))] mt-8 mb-4">
                {t('sections.service.title')}
              </h2>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t('sections.service.content', { brand: tCommon('brand') })}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--color-muted-foreground))] mb-4">
                <li>{t('sections.service.list.browser')}</li>
                <li>{t('sections.service.list.uploads')}</li>
                <li>{t('sections.service.list.access')}</li>
                <li>{t('sections.service.list.device')}</li>
              </ul>

              <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))] mt-8 mb-4">
                {t('sections.collection.title')}
              </h2>
              <h3 className="text-xl font-semibold text-[hsl(var(--color-foreground))] mt-6 mb-3">
                {t('sections.collection.files.title')}
              </h3>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t.rich('sections.collection.files.content', {
                  strong1: (chunks) => <strong>{chunks}</strong>
                })}
              </p>

              <h3 className="text-xl font-semibold text-[hsl(var(--color-foreground))] mt-6 mb-3">
                {t('sections.collection.usage.title')}
              </h3>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t('sections.collection.usage.content')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--color-muted-foreground))] mb-4">
                <li>{t('sections.collection.usage.list.popular')}</li>
                <li>{t('sections.collection.usage.list.region')}</li>
                <li>{t('sections.collection.usage.list.browser')}</li>
                <li>{t('sections.collection.usage.list.device')}</li>
              </ul>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t('sections.collection.usage.note')}
              </p>

              <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))] mt-8 mb-4">
                {t('sections.storage.title')}
              </h2>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t('sections.storage.content', { brand: tCommon('brand') })}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--color-muted-foreground))] mb-4">
                <li>{t('sections.storage.list.lang')}</li>
                <li>{t('sections.storage.list.history')}</li>
                <li>{t('sections.storage.list.progress')}</li>
              </ul>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t('sections.storage.note')}
              </p>

              <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))] mt-8 mb-4">
                {t('sections.cookies.title')}
              </h2>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t('sections.cookies.content')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--color-muted-foreground))] mb-4">
                <li>
                  {t.rich('sections.cookies.list.essential', {
                    strong1: (chunks) => <strong>{chunks}</strong>
                  })}
                </li>
                <li>
                  {t.rich('sections.cookies.list.preference', {
                    strong1: (chunks) => <strong>{chunks}</strong>
                  })}
                </li>
              </ul>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t('sections.cookies.note')}
              </p>

              <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))] mt-8 mb-4">
                {t('sections.thirdParty.title')}
              </h2>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t('sections.thirdParty.content', { brand: tCommon('brand') })}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--color-muted-foreground))] mb-4">
                <li>{t('sections.thirdParty.list.analytics')}</li>
                <li>{t('sections.thirdParty.list.ads')}</li>
                <li>{t('sections.thirdParty.list.social')}</li>
                <li>{t('sections.thirdParty.list.processing')}</li>
              </ul>

              <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))] mt-8 mb-4">
                {t('sections.security.title')}
              </h2>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t('sections.security.content')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--color-muted-foreground))] mb-4">
                <li>{t('sections.security.list.browser')}</li>
                <li>{t('sections.security.list.os')}</li>
                <li>{t('sections.security.list.network')}</li>
              </ul>

              <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))] mt-8 mb-4">
                {t('sections.rights.title')}
              </h2>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t('sections.rights.content', { brand: tCommon('brand') })}
              </p>

              <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))] mt-8 mb-4">
                {t('sections.children.title')}
              </h2>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t('sections.children.content', { brand: tCommon('brand') })}
              </p>

              <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))] mt-8 mb-4">
                {t('sections.changes.title')}
              </h2>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t('sections.changes.content')}
              </p>

              <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))] mt-8 mb-4">
                {t('sections.contact.title')}
              </h2>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-4">
                {t('sections.contact.content')}
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Badge */}
        <section className="py-12 bg-[hsl(var(--color-muted)/0.3)]">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-green-50 border border-green-200 rounded-lg">
                <Shield className="h-8 w-8 text-green-600" />
                <div className="text-left">
                  <p className="font-semibold text-green-800">
                    {tCommon('footer.privacyBadge')}
                  </p>
                  <p className="text-sm text-green-600">
                    {t('badge.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
