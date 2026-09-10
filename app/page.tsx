import {Discover} from '@/components/discover';
import {getLaunchPage} from '@/lib/data';
import {getProtocolMetrics} from '@/lib/market-indexer';

export const revalidate=30;
export const dynamic='force-dynamic';

export default async function Home(){
  const [launchPage,metrics]=await Promise.all([getLaunchPage(),getProtocolMetrics()]);
  return <Discover initialPage={launchPage} metrics={metrics.updatedAt?metrics:{...metrics,totalLaunches:launchPage.total}}/>;
}
