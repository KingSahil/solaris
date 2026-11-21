import { useQuery } from '@tanstack/react-query';
import { ChartColumn } from 'lucide-react';
import { fetchProduction, PRODUCTION_KEY } from '../api/staffData';
import { PageHead } from '../components/PageHead';
import { formatDay } from '../lib/dates';
import { useCurrentUser } from '../session/session';
import { opensFor } from '../shell/sections';
import { Empty, NotAllowed } from '../states/States';
import { QueryView } from '../states/QueryView';

export function ProductionPage() {
  const me = useCurrentUser();
  const query = useQuery({ queryKey: PRODUCTION_KEY, queryFn: ({ signal }) => fetchProduction(signal), enabled: me.role === 'Admin' });
  if (!opensFor(me.role, '/production')) return <NotAllowed />;
  return <>
    <PageHead title="Production" />
    <p className="page-intro">Daily energy generation compared with each system's expected output.</p>
    <QueryView query={query} what="production data" isEmpty={data => data.installationCount === 0} empty={<Empty icon={ChartColumn} title="No production yet">Daily production appears when readings are available.</Empty>}>
      {data => <>
        <p className="production-day">Fleet snapshot · {data.day ? formatDay(data.day) : 'No completed production day'}</p>
        <div className="health-grid" aria-label="System health counts">{data.healthCounts.map(x => <div className="health-card" key={x.health}><span className="a-label">{x.health}</span><strong className="a-stat">{x.count}</strong></div>)}</div>
        <h2 className="section-title">Systems to review <span>Lowest production against expected</span></h2>
        <div className="table-wrap directory-table"><table className="table"><caption className="sr">Lowest producing systems</caption>
          <thead><tr><th scope="col">Customer</th><th scope="col">Health</th><th scope="col">Actual</th><th scope="col">Expected</th><th scope="col" className="r">Readings</th></tr></thead>
          <tbody>{data.worstPerformers.map(x => <tr key={x.installationId}><td>{x.customerName}</td><td><span className={`record-status record-status-${x.health.toLowerCase()}`}>{x.health}</span></td><td className="num">{x.actualKwh.toFixed(1)} kWh</td><td className="num">{x.expectedKwh.toFixed(1)} kWh</td><td className="num r">{x.readingCount}</td></tr>)}</tbody>
        </table></div>
      </>}
    </QueryView>
  </>;
}
