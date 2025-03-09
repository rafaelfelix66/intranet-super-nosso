
import { CarouselBanner } from "@/components/home/CarouselBanner";
import { QuickAccess } from "@/components/home/QuickAccess";
import { RecentActivity } from "@/components/home/RecentActivity";
import { CalendarWidget } from "@/components/home/Calendar";
import { Layout } from "@/components/layout/Layout";

const Index = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <CarouselBanner />
        
        <QuickAccess />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
          <div>
            <CalendarWidget />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
