import React from 'react';
import { SmartNotificationCenter } from '@/components/smart-notification-center';
import Navigation from '@/components/navigation';
import Footer from '@/components/footer';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <SmartNotificationCenter />
      <Footer />
    </div>
  );
}